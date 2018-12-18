export class ValidationError extends Error {
  public readonly field: string;
  constructor(field: string, message: string) {
    super(`${field} ${message}`);
    this.field = field;
  }
}

export class InputError extends Error { }

export function invalidInput(message: string): Error {
  return new InputError(message);
}

export function invalidProperty(prop: string, message: string): Error {
  return new ValidationError(prop, message);
}

export function assertPresent(value: unknown, propertyName: string) {
  if (!value) {
    throw new ValidationError(propertyName, "is required");
  }
}

export function assertUrl(value: string | URL, propertyName: string) {
  if (value instanceof URL) {
    return;
  }

  if (typeof value === "string") {
    try {
      console.log("assertUrl", {value})
      const x = new URL(value);
      console.log("after url assertUrl", { value, x })
      return;
    } catch (err) { }
  }

  throw new ValidationError(propertyName, "must be a valid url");
}
