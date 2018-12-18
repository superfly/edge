export function isObject<T = any>(thing: unknown): thing is Partial<T> {
  return thing !== null && typeof thing === "object"
}
