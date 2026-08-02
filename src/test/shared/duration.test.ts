import * as assert from "assert";
import { parseDuration } from "../../nodes/shared/duration";

describe("shared/duration", () => {
  it("passes through a raw 0-255 number", () => {
    assert.strictEqual(parseDuration(200), 200);
  });

  it("rejects an out-of-range raw number", () => {
    assert.throws(() => parseDuration(300), /Incorrect Duration/);
  });

  it("parses seconds", () => {
    assert.strictEqual(parseDuration("10 seconds"), 10);
  });

  it("parses minutes", () => {
    assert.strictEqual(parseDuration("2 minutes"), 62);
  });

  it("parses hours", () => {
    assert.strictEqual(parseDuration("2 hours"), 122);
  });

  it("parses days", () => {
    assert.strictEqual(parseDuration("2 days"), 168);
  });

  it("parses 'forever' as 255", () => {
    assert.strictEqual(parseDuration("forever"), 255);
  });

  it("parses 'off' as 0", () => {
    assert.strictEqual(parseDuration("off"), 0);
  });

  it("rejects an unrecognized unit", () => {
    assert.throws(() => parseDuration("10 fortnights"), /Incorrect Duration Format/);
  });

  // Regression test: Z-Wave config parameters are integers. A fractional
  // value (most likely from a payload override, e.g. msg.payload.duration =
  // 10.5) used to flow straight through into the bitpacked notification
  // value uncorrected, producing a non-integer parameter write.
  it("rounds a fractional raw number to the nearest integer", () => {
    assert.strictEqual(parseDuration(10.6), 11);
    assert.strictEqual(parseDuration(10.4), 10);
  });
});
