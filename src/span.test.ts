import { describe, test, expect } from "bun:test";
import { MockSpan } from "./span";

describe("MockSpan", () => {
  describe("setAttribute", () => {
    test("it should correctly set a string attribute", () => {
      const span = new MockSpan();
      const result = span.setAttribute("key1", "value1");

      expect(result).toBe(span);
      expect(span.isRecording()).toBe(true);
    });

    test("it should correctly set a number attribute", () => {
      const span = new MockSpan();
      const result = span.setAttribute("count", 42);

      expect(result).toBe(span);
    });

    test("it should correctly set a boolean attribute", () => {
      const span = new MockSpan();
      const result = span.setAttribute("enabled", true);

      expect(result).toBe(span);
    });

    test("it should allow setting multiple attributes via chaining", () => {
      const span = new MockSpan();
      const result = span
        .setAttribute("key1", "value1")
        .setAttribute("key2", 123)
        .setAttribute("key3", true);

      expect(result).toBe(span);
    });

    test("it should return self for method chaining", () => {
      const span = new MockSpan();
      const result = span.setAttribute("key", "value");
      expect(result).toBe(span);
    });
  });

  describe("setAttributes", () => {
    test("it should correctly set multiple attributes at once", () => {
      const span = new MockSpan();
      const result = span.setAttributes({
        key1: "value1",
        key2: 123,
        key3: true,
      });

      expect(result).toBe(span);
    });

    test("it should ignore undefined attribute values", () => {
      const span = new MockSpan();
      const result = span.setAttributes({
        key1: "value1",
        key2: undefined,
      });

      expect(result).toBe(span);
    });
  });

  describe("end", () => {
    test("it should complete without throwing an error", () => {
      const span = new MockSpan();
      expect(() => span.end()).not.toThrow();
    });

    test("it should handle multiple calls to end without error", () => {
      const span = new MockSpan();
      span.end();
      expect(() => span.end()).not.toThrow();
    });

    test("it should set isRecording to false after end", () => {
      const span = new MockSpan();
      expect(span.isRecording()).toBe(true);
      span.end();
      expect(span.isRecording()).toBe(false);
    });
  });

  describe("spanContext", () => {
    test("it should return a valid span context", () => {
      const span = new MockSpan();
      const context = span.spanContext();

      expect(context.traceId).toBe("00000000000000000000000000000000");
      expect(context.spanId).toBe("0000000000000000");
      expect(context.traceFlags).toBe(0);
    });

    test("it should return a valid context after end", () => {
      const span = new MockSpan();
      span.end();
      const context = span.spanContext();

      expect(context.traceId).toBeTruthy();
      expect(context.spanId).toBeTruthy();
    });
  });

  describe("isRecording", () => {
    test("it should return true before end is called", () => {
      const span = new MockSpan();
      expect(span.isRecording()).toBe(true);
    });

    test("it should return false after end is called", () => {
      const span = new MockSpan();
      span.end();
      expect(span.isRecording()).toBe(false);
    });
  });

  describe("setStatus", () => {
    test("it should return self for method chaining", () => {
      const span = new MockSpan();
      const result = span.setStatus({ code: 1, message: "error" });

      expect(result).toBe(span);
    });
  });

  describe("updateName", () => {
    test("it should return self for method chaining", () => {
      const span = new MockSpan();
      const result = span.updateName("new-name");

      expect(result).toBe(span);
    });
  });

  describe("addEvent", () => {
    test("it should return self for method chaining", () => {
      const span = new MockSpan();
      const result = span.addEvent("test-event");

      expect(result).toBe(span);
    });
  });
});
