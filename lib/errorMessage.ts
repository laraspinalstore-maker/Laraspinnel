/**
 * Read a display message off an unknown thrown value.
 *
 * `catch (err: any)` followed by `err.message || "fallback"` was the pattern in
 * five client components. `any` is not merely a lint complaint here: a `throw`
 * can carry anything — a string, a rejected fetch value, `undefined` — and
 * reading `.message` off a non-object is a TypeError thrown from inside the catch
 * block, which loses the original failure and takes down the component with it.
 *
 * `unknown` forces the narrowing this does once, in one place.
 */
export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "string" && error) return error;
  return fallback;
}
