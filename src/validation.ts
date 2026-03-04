export function validateParamKey(key: string): void {
  if (!/^[^\/?#]+$/.test(key)) {
    throw new Error(
      `Invalid parameter key: "${key}". Parameter keys must be non-empty and cannot contain '/', '?', or '#' characters.`,
    );
  }
}

export function validateParamValue(key: string, value: string): void {
  if (value === "" || value == null) {
    throw new Error(
      `Invalid parameter value for key "${key}": values must be non-empty.`,
    );
  }
}
