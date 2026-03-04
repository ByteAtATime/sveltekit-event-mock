import type { Span, Tracing } from "./types";

export class MockSpan implements Span {
  private attributes = new Map<string, unknown>();

  attribute(key: string, value: unknown): Span {
    this.attributes.set(key, value);
    return this;
  }

  end(): void {}

  __getAttributes(): Map<string, unknown> {
    return this.attributes;
  }
}

export type { Span, Tracing };
