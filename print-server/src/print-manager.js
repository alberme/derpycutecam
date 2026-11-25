import { execFile } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import { promisify } from "node:util";

import { getPrinterStatus, isPrinterBlocked } from "./print-status.js";

const exec = promisify(execFile);

const TERMINAL = new Set(["finished_in_cups", "failed", "cancelled"]);

export class PrintManager {
  constructor(printerName) {
    this.printerName = printerName;
    this.jobs = new Map();
    this.requestIds = new Map();
    this.pending = [];
    this.processing = false;

    this.pollInterval = setInterval(() => {
      if (this.pending.length > 0) {
        void this.processQueue().catch((error) => {
          console.error("Queue processing error:", error);
        });
      }
    }, 3000);
  }

  createJob({ filePath, requestId }) {
    if (requestId && this.requestIds.has(requestId)) {
      return {
        job: this.jobs.get(this.requestIds.get(requestId)),
        duplicate: true,
      };
    }

    const job = {
      id: randomUUID(),
      requestId,
      filePath,
      cupsJobId: null,
      status: "queued",
      error: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.jobs.set(job.id, job);

    if (requestId) {
      this.requestIds.set(requestId, job.id);
    }

    this.pending.push(job.id);
    void this.processQueue();

    return { job, duplicate: false };
  }

  update(job, status, extra = {}) {
    Object.assign(job, extra, {
      status,
      updatedAt: new Date().toISOString(),
    });

    console.log(`[PRINT] ${job.id} → ${status}`);
  }

  async processQueue() {
    if (this.processing) return;

    this.processing = true;

    try {
      while (this.pending.length > 0) {
        const id = this.pending[0];
        const job = this.jobs.get(id);

        // Skip invalid or inactive jobs.
        if (!job || !["queued", "waiting_for_printer"].includes(job.status)) {
          this.pending.shift();
          continue;
        }

        // Check printer availability.
        let printerStatus;

        try {
          printerStatus = await getPrinterStatus();
        } catch (error) {
          console.error("Unable to check printer status:", error);

          printerStatus = {
            state: "unavailable",
            reasons: ["printer-unreachable"],
            hasError: true,
          };
        }

        if (isPrinterBlocked(printerStatus)) {
          const reason = printerStatus.reasons.join(", ");

          if (job.status !== "waiting_for_printer" || job.error !== reason) {
            this.update(job, "waiting_for_printer", {
              error: reason,
            });
          }

          // Keep job in queue for next poll.
          break;
        }

        // Printer is available.
        this.pending.shift();

        this.update(job, "submitting", {
          error: null,
        });

        try {
          const { stdout } = await exec(
            "lp",
            [
              "-d",
              this.printerName,
              "-t",
              `photobooth-${job.id}`,
              "-o",
              "PageSize=Postcard.Borderless",
              "-o",
              "print-scaling=none",
              "-o",
              "ColorModel=RGB",
              "-o",
              "copies=1",
              job.filePath,
            ],
            { timeout: 30000 },
          );

          const match = stdout.match(/request id is (\S+)/);

          if (!match) {
            throw new Error(`Could not parse CUPS response: ${stdout}`);
          }

          this.update(job, "submitted", {
            cupsJobId: match[1],
          });
        } catch (error) {
          this.update(job, "failed", {
            error: error.message,
          });
        } finally {
          await fs.unlink(job.filePath).catch(() => {});
          job.filePath = null;
        }
      }
    } finally {
      this.processing = false;
    }
  }

  getJob(id) {
    return this.jobs.get(id) ?? null;
  }

  listJobs() {
    return [...this.jobs.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    );
  }

  async refreshStatus(job) {
    if (!job.cupsJobId || job.status !== "submitted") {
      return job;
    }

    // CUPS reports finished jobs through its
    // completed-job history, which may also
    // contain cancelled or aborted jobs.
    const { stdout } = await exec(
      "lpstat",
      ["-W", "completed", "-o", this.printerName],
      { timeout: 10000 },
    );

    const found = stdout
      .split("\n")
      .some((line) => line.startsWith(`${job.cupsJobId} `));

    if (found) {
      this.update(job, "finished_in_cups");
    }

    return job;
  }

  async cancelJob(id) {
    const job = this.getJob(id);

    if (!job) return null;
    if (TERMINAL.has(job.status)) return job;

    if (job.status === "queued") {
      this.pending = this.pending.filter((pendingId) => pendingId !== id);

      await fs.unlink(job.filePath).catch(() => {});
      job.filePath = null;
      this.update(job, "cancelled");
      return job;
    }

    if (job.status === "submitting") {
      throw new Error("Job is being submitted; retry cancellation");
    }

    if (job.cupsJobId) {
      await exec("cancel", [job.cupsJobId]);
      this.update(job, "cancelled");
    }

    return job;
  }
}
