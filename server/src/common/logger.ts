import { Writable } from "stream";

import bunyan from "bunyan";

import config from "@/config";

const LEVEL_NAMES: Record<number, string> = {
  10: "TRACE",
  20: "DEBUG",
  30: "INFO",
  40: "WARN",
  50: "ERROR",
  60: "FATAL",
};

const LEVEL_COLORS: Record<number, string> = {
  10: "\x1b[90m", // gray
  20: "\x1b[36m", // cyan
  30: "\x1b[32m", // green
  40: "\x1b[33m", // yellow
  50: "\x1b[31m", // red
  60: "\x1b[35m", // magenta
};

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";

function formatRecord(rec: Record<string, unknown>): string {
  const level = rec.level as number;
  const color = LEVEL_COLORS[level] || "";
  const levelName = LEVEL_NAMES[level] || "???";
  const time = new Date(rec.time as string).toLocaleTimeString("fr-FR", { hour12: false });
  const msg = rec.msg as string;

  // Extract context fields (exclude bunyan internals)
  const excluded = new Set(["v", "name", "hostname", "pid", "level", "time", "msg", "src"]);
  const context: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(rec)) {
    if (!excluded.has(key)) {
      context[key] = value;
    }
  }

  // Format HTTP requests on a single line
  if (context.type === "http") {
    const { method, url, statusCode, responseTime, ...rest } = context as Record<string, unknown>;
    const statusColor = (statusCode as number) >= 400 ? "\x1b[31m" : "\x1b[32m";
    const extra = Object.keys(rest).length > 0 ? ` ${DIM}${JSON.stringify(rest)}${RESET}` : "";
    return `${DIM}${time}${RESET} ${color}${levelName}${RESET} ${method} ${url} ${statusColor}${statusCode}${RESET} ${DIM}${responseTime}ms${RESET}${extra}\n`;
  }

  const extra = Object.keys(context).length > 0 ? ` ${DIM}${JSON.stringify(context)}${RESET}` : "";
  return `${DIM}${time}${RESET} ${color}${levelName}${RESET} ${msg}${extra}\n`;
}

const createStreams = () => {
  const { type, level } = config.log;

  if (process.env.NODE_ENV === "test") {
    return [];
  }

  const jsonStream = () => {
    return {
      name: "json",
      level,
      stream: process.stdout,
    };
  };

  const consoleStream = () => {
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        try {
          const rec = JSON.parse(chunk.toString());
          process.stdout.write(formatRecord(rec));
        } catch {
          process.stdout.write(chunk);
        }
        callback();
      },
    });
    return {
      name: "console",
      level,
      stream,
    };
  };

  const streams = type === "console" ? [consoleStream()] : [jsonStream()];

  return streams;
};

export default bunyan.createLogger({
  name: config.appName,
  serializers: bunyan.stdSerializers,
  /** @ts-expect-error */
  streams: createStreams(),
});
