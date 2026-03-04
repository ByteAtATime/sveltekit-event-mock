import { describe, test, expect } from "bun:test";
import { validateParamKey, validateParamValue } from "./validation";

describe("validateParamKey", () => {
  test("it should throw error when withParam receives empty key", () => {
    expect(() => validateParamKey("")).toThrow(
      'Invalid parameter key: "". Parameter keys must be non-empty and cannot contain \'/\', \'?\', or \'#\' characters.',
    );
  });

  test("it should throw error when withParam key contains forward slash", () => {
    expect(() => validateParamKey("invalid/key")).toThrow(
      'Invalid parameter key: "invalid/key". Parameter keys must be non-empty and cannot contain \'/\', \'?\', or \'#\' characters.',
    );
  });

  test("it should throw error when withParam key contains question mark", () => {
    expect(() => validateParamKey("invalid?key")).toThrow(
      'Invalid parameter key: "invalid?key". Parameter keys must be non-empty and cannot contain \'/\', \'?\', or \'#\' characters.',
    );
  });

  test("it should throw error when withParam key contains hash", () => {
    expect(() => validateParamKey("invalid#key")).toThrow(
      'Invalid parameter key: "invalid#key". Parameter keys must be non-empty and cannot contain \'/\', \'?\', or \'#\' characters.',
    );
  });

  test("it should not throw error for valid key", () => {
    expect(() => validateParamKey("validKey")).not.toThrow();
  });
});

describe("validateParamValue", () => {
  test("it should throw error when withParam receives empty value", () => {
    expect(() => validateParamValue("key", "")).toThrow(
      'Invalid parameter value for key "key": values must be non-empty.',
    );
  });

  test("it should throw error when withParam receives null value", () => {
    expect(() => validateParamValue("key", null as any)).toThrow(
      'Invalid parameter value for key "key": values must be non-empty.',
    );
  });

  test("it should not throw error for valid value", () => {
    expect(() => validateParamValue("key", "validValue")).not.toThrow();
  });
});
