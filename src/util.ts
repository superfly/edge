import { merge as _merge, pick } from "lodash";

export function isObject<T = any>(thing: unknown): thing is Partial<T> {
  return thing !== null && typeof thing === "object"
}

export function merge<T>(target: T, other: {}, keys: (keyof T)[]): T {
  return _merge(target, pick(other, keys));
}