import * as assert from "assert";
import { parseColor, rgbToHue } from "../../nodes/shared/color";
describe("shared/color", () => {
  describe("parseColor", () => {
    it("parses a hex string", () => {
      assert.deepStrictEqual(parseColor("#ff0000", "test"), [255, 0, 0]);
    });
    it("parses a color keyword", () => {
      assert.deepStrictEqual(parseColor("Red", "test"), [255, 0, 0]);
    });
    it("parses an RGB array", () => {
      assert.deepStrictEqual(parseColor([10, 20, 30], "test"), [10, 20, 30]);
    });
    it("rejects an RGB array with a value over 255", () => {
      assert.throws(() => parseColor([300, 0, 0], "test"), /exceed 255/);
    });
    it("rejects an RGB array with the wrong length", () => {
      assert.throws(() => parseColor([1, 2], "test"), /Invalid array format/);
    });
    it("parses hue 361 as white", () => {
      assert.deepStrictEqual(parseColor(361, "test"), [255, 255, 255]);
    });
    it("parses a 0-360 hue value", () => {
      const [r, g, b] = parseColor(0, "test");
      assert.strictEqual(r, 255);
      assert.strictEqual(g, 0);
      assert.strictEqual(b, 0);
    });
    it("rejects an out-of-range hue value", () => {
      assert.throws(() => parseColor(400, "test"), /Incorrect Color/);
    });
  });
  describe("rgbToHue", () => {
    it("treats equal RGB components as white (255)", () => {
      assert.deepStrictEqual(rgbToHue([10, 10, 10]), { hue: 255, keyword: "white" });
    });
    it("converts red to the Inovelli 0-255 hue scale", () => {
      const { hue } = rgbToHue([255, 0, 0]);
      assert.strictEqual(hue, 0);
    });
  });
});
