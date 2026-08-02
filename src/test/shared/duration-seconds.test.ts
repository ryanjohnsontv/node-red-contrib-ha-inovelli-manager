import * as assert from "assert";
import { parseSecondsValue } from "../../nodes/shared/duration";
describe("shared/duration parseSecondsValue", () => {
  it("passes through a raw number of seconds", () => {
    assert.strictEqual(parseSecondsValue(600, 32767), 600);
  });
  it("passes through a numeric string", () => {
    assert.strictEqual(parseSecondsValue("600", 32767), 600);
  });
  it("parses minutes", () => {
    assert.strictEqual(parseSecondsValue("10 minutes", 32767), 600);
  });
  it("parses hours", () => {
    assert.strictEqual(parseSecondsValue("2 hours", 32767), 7200);
  });
  it("parses days (against a generous max, independent of any real parameter's cap)", () => {
    assert.strictEqual(parseSecondsValue("1 day", 100000), 86400);
  });
  it("rejects a value over the given max (Auto-Off Timer's real max is 32767 = ~9.1 hours, so a full day is invalid there)", () => {
    assert.throws(() => parseSecondsValue("1 day", 32767), /Must be between 0 and 32767/);
    assert.throws(() => parseSecondsValue(40000, 32767), /Must be between 0 and 32767/);
  });
  it("rejects an unrecognized format", () => {
    assert.throws(() => parseSecondsValue("10 fortnights", 32767), /Incorrect value format/);
  });
  it("rounds a fractional raw number to the nearest integer", () => {
    assert.strictEqual(parseSecondsValue(10.6, 32767), 11);
    assert.strictEqual(parseSecondsValue(10.4, 32767), 10);
  });
});
