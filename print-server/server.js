import express from "express";
import morgan from "morgan";
import multer from "multer";
import { execFile } from "node:child_process";
import { timingSafeEqual } from "node:crypto";
import fs from "node:fs/promises";
import { promisify } from "node:util";

import { PrintManager } from "./src/print-manager.js";
import { getPrinterStatus } from "./src/print-status.js";

const app = express();
const execFileAsync = promisify(execFile);

const PORT = Number(process.env.PORT || 3000);
const PRINTER = process.env.PRINTER_NAME || "CP1500_IPP";
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable is required");
}

const printManager = new PrintManager(process.env.PRINTER_NAME);

// customize morgan logs
morgan.token("printer", () => process.env.PRINTER_NAME);
morgan.token("job-id", (req, res) => {
  return res.locals.jobId || "-";
});

const upload = multer({
  dest: "/app/uploads",
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "image/jpeg") {
      return cb(new Error("Only JPEG images are accepted"));
    }
    cb(null, true);
  },
});

function authenticate(req, res, next) {
  const supplied = req.header("x-api-key") || "";
  const a = Buffer.from(supplied);
  const b = Buffer.from(API_KEY);

  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }

  next();
}

app.use(
  morgan(":method :url :status :response-time ms printer=:printer job=:job-id"),
);

app.use(authenticate);

app.get("/health", async (req, res) => {
  try {
    const { stdout } = await execFileAsync("lpstat", ["-p", PRINTER]);

    res.json({
      status: "ok",
      printer: PRINTER,
      cups: stdout.trim(),
    });
  } catch {
    res.status(503).json({
      status: "unavailable",
      printer: PRINTER,
    });
  }
});

app.get("/status", async (req, res) => {
  try {
    const status = await getPrinterStatus();
    res.json(status);
  } catch (error) {
    res.status(503).json({
      state: "unavailable",
      hasError: true,
      errors: ["printer-unreachable"],
      message: error.message,
    });
  }
});

// Return public job fields only.
function serializeJob(job) {
  const { filePath, ...publicJob } = job;

  return publicJob;
}

// Create a print job
app.post("/print", upload.single("photo"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "JPEG photo required",
    });
  }

  const filePath = req.file.path;

  try {
    const file = await fs.open(filePath, "r");
    const signature = Buffer.alloc(3);

    try {
      await file.read(signature, 0, 3, 0);
    } finally {
      await file.close();
    }

    if (signature.toString("hex") !== "ffd8ff") {
      await fs.unlink(filePath);
      return res.status(400).json({
        error: "Invalid JPEG",
      });
    }

    const requestId = req.header("Idempotency-Key") || null;

    const { job, duplicate } = printManager.createJob({
      filePath,
      requestId,
    });

    if (duplicate) {
      await fs.unlink(filePath);
    }

    res.status(202).json({
      ...serializeJob(job),
      duplicate,
    });
  } catch (error) {
    await fs.unlink(filePath).catch(() => {});

    res.status(500).json({
      error: "Unable to create print job",
    });
  }
});

// List jobs
app.get("/jobs", (req, res) => {
  res.json(printManager.listJobs().map(serializeJob));
});

// Get job status
app.get("/jobs/:id", async (req, res) => {
  const job = printManager.getJob(req.params.id);

  if (!job) {
    return res.status(404).json({
      error: "Job not found",
    });
  }

  try {
    await printManager.refreshStatus(job);

    res.json(serializeJob(job));
  } catch (error) {
    res.status(503).json({
      error: "Unable to query CUPS status",
      job: serializeJob(job),
    });
  }
});

// Cancel job
app.delete("/jobs/:id", async (req, res) => {
  try {
    const job = await printManager.cancelJob(req.params.id);

    if (!job) {
      return res.status(404).json({
        error: "Job not found",
      });
    }

    res.json(serializeJob(job));
  } catch (error) {
    res.status(409).json({
      error: error.message,
    });
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(400).json({
    error: err.message || "Invalid request",
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Print API listening on ${PORT}`);
});
