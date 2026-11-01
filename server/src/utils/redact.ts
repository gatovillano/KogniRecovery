const SENSITIVE_KEYS = /password|token|secret|api[_-]?key|authorization|cookie|email/i;

export const redact = (value: unknown, seen = new WeakSet<object>()): unknown => {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    // Redact obvious bearer tokens / JWT-like strings
    if (/^Bearer\s+/i.test(value)) return 'Bearer [REDACTED]';
    if (value.split('.').length === 3 && value.length > 40) return '[REDACTED_JWT]';
    return value;
  }
  if (typeof value !== 'object') return value;
  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);
  if (Array.isArray(value)) return value.map((v) => redact(v, seen));
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = SENSITIVE_KEYS.test(k) ? '[REDACTED]' : redact(v, seen);
  }
  return out;
};

export const installRedactingConsole = (): void => {
  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    info: console.info.bind(console),
  };
  console.log = (...args: unknown[]) => original.log(...args.map((a) => redact(a)));
  console.warn = (...args: unknown[]) => original.warn(...args.map((a) => redact(a)));
  console.error = (...args: unknown[]) => original.error(...args.map((a) => redact(a)));
  console.info = (...args: unknown[]) => original.info(...args.map((a) => redact(a)));
};
