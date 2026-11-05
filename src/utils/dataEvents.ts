/** Structured data-path diagnostics. Do not pass errors, request headers or credentials. */
export function reportDataEvent(event: "fallback" | "remote-error" | "cache-expired", scope: string) {
  console.warn(JSON.stringify({ event: `data.${event}`, scope }));
}
