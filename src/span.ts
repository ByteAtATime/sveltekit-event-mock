import type {
  Span,
  SpanContext,
  Attributes,
  SpanStatus,
  Link,
  TimeInput,
  Exception,
} from "@opentelemetry/api";

export class MockSpan implements Span {
  private _attributes = new Map<string, unknown>();
  private _status: SpanStatus = { code: 0 };
  private _isRecording = true;

  spanContext(): SpanContext {
    return {
      traceId: "00000000000000000000000000000000",
      spanId: "0000000000000000",
      traceFlags: 0,
    };
  }

  setAttribute(key: string, value: unknown): this {
    this._attributes.set(key, value);
    return this;
  }

  setAttributes(attributes: Attributes): this {
    for (const [key, value] of Object.entries(attributes)) {
      if (value !== undefined) {
        this._attributes.set(key, value);
      }
    }
    return this;
  }

  addEvent(
    _name: string,
    _attributesOrStartTime?: Attributes | TimeInput,
    _startTime?: TimeInput,
  ): this {
    return this;
  }

  addLink(_link: Link): this {
    return this;
  }

  addLinks(_links: Link[]): this {
    return this;
  }

  setStatus(status: SpanStatus): this {
    this._status = status;
    return this;
  }

  updateName(_name: string): this {
    return this;
  }

  end(_endTime?: TimeInput): void {
    this._isRecording = false;
  }

  isRecording(): boolean {
    return this._isRecording;
  }

  recordException(_exception: Exception, _time?: TimeInput): void {
    // no-op for now
  }
}

export type { Span, Tracing } from "./types";
