import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export function isPrinterBlocked(status) {
  return (
    status.state === "stopped" ||
    status.state === "unknown" ||
    status.state === "unavailable" ||
    status.hasError
  );
}

export async function getPrinterStatus() {
  const printerUri = process.env.PRINTER_URI;

  if (!printerUri) {
    throw new Error("PRINTER_URI is required");
  }

  const { stdout } = await exec(
    "ipptool",
    ["-tv", printerUri, "/usr/share/cups/ipptool/get-printer-attributes.test"],
    { timeout: 10000 },
  );

  const getAttribute = (name) => {
    const pattern = new RegExp(
      `^\\s*${name}\\s+\\([^)]*\\)\\s*=\\s*(.*)$`,
      "m",
    );

    return stdout.match(pattern)?.[1]?.trim() ?? null;
  };

  const state = getAttribute("printer-state");
  const reasonsRaw = getAttribute("printer-state-reasons");

  const reasons = reasonsRaw
    ? reasonsRaw.split(",").map((reason) => reason.trim())
    : [];

  const hasError =
    state === "stopped" || reasons.some((reason) => reason.endsWith("-error"));

  const errors = hasError ? reasons.filter((reason) => reason !== "none") : [];

  return {
    state: state ?? "unknown",
    reasons,
    hasError,
    errors,
    checkedAt: new Date().toISOString(),
  };
}
