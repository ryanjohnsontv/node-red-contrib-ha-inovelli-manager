import * as assert from "assert";
import {
  resolveLedSwitch,
  resolveNotificationSwitch,
  SCENE_BUTTON_MAPS,
  PIXEL_EFFECTS,
  NotificationSwitchDef,
} from "../../nodes/shared/switches";
function resolveRedNotificationSwitch(input: string | number): NotificationSwitchDef {
  return resolveNotificationSwitch(input) as NotificationSwitchDef;
}
describe("shared/switches", () => {
  describe("resolveLedSwitch", () => {
    it("resolves LZW30-SN by numeric or string alias", () => {
      assert.deepStrictEqual(resolveLedSwitch(5).params, { color: 5, brightness: 6, brightnessOff: 7 });
      assert.deepStrictEqual(resolveLedSwitch("lzw30-sn").params, resolveLedSwitch(5).params);
    });
    it("resolves LZW36 combo to both light and fan params", () => {
      const def = resolveLedSwitch(38);
      assert.deepStrictEqual(def.params, {
        color: 18,
        brightness: 19,
        brightnessOff: 22,
        fanColor: 20,
        fanBrightness: 21,
        fanBrightnessOff: 23,
      });
    });
    it("throws on an unknown switch type", () => {
      assert.throws(() => resolveLedSwitch(999), /Incorrect Switch Type/);
    });
    it("resolves a numeric-looking string the same as the number (matches what a <select> actually stores)", () => {
      assert.deepStrictEqual(resolveLedSwitch("5").params, resolveLedSwitch(5).params);
      assert.deepStrictEqual(resolveLedSwitch("38").params, resolveLedSwitch(38).params);
    });
  });
  describe("resolveNotificationSwitch", () => {
    it("resolves LZW45 to parameter 21 with its own effect set", () => {
      const def = resolveRedNotificationSwitch("lzw45");
      assert.strictEqual(def.param, 21);
      assert.strictEqual(def.effects["fast fade"], 5);
      assert.strictEqual(def.effects["slow fade"], 6);
    });
    it("marks the legacy 49 sentinel as a combo switch", () => {
      const def = resolveRedNotificationSwitch(49);
      assert.strictEqual(def.isCombo, true);
    });
    it("throws on an unknown switch type", () => {
      assert.throws(() => resolveNotificationSwitch("nope"), /Incorrect Switch Type/);
    });
    it("resolves a numeric-looking string the same as the number (matches what a <select> actually stores)", () => {
      assert.strictEqual(resolveRedNotificationSwitch("8").param, resolveRedNotificationSwitch(8).param);
      assert.strictEqual(resolveRedNotificationSwitch("49").isCombo, true);
    });
    it("resolves LZW45 Pixel Effect (parameter 31) with the pixelEffect format", () => {
      const def = resolveRedNotificationSwitch("pixel effect");
      assert.strictEqual(def.param, 31);
      assert.strictEqual(def.format, "pixelEffect");
      assert.strictEqual(resolveRedNotificationSwitch(31).format, "pixelEffect");
    });
  });
  describe("PIXEL_EFFECTS", () => {
    it("has exactly 45 entries numbered 1-45 with no gaps or duplicates", () => {
      const values = Object.values(PIXEL_EFFECTS).sort((a, b) => a - b);
      assert.strictEqual(values.length, 45);
      assert.deepStrictEqual(
        values,
        Array.from({ length: 45 }, (_, i) => i + 1)
      );
    });
    it("matches known name/number pairs from the zwave-js source", () => {
      assert.strictEqual(PIXEL_EFFECTS["static"], 1);
      assert.strictEqual(PIXEL_EFFECTS["rainbow"], 10);
      assert.strictEqual(PIXEL_EFFECTS["strobe"], 23);
      assert.strictEqual(PIXEL_EFFECTS["fireworks"], 40);
      assert.strictEqual(PIXEL_EFFECTS["aurora"], 45);
    });
  });
  describe("SCENE_BUTTON_MAPS", () => {
    it("has 15 entries for LZW30/LZW31, 18 for LZW36, 15 for LZW45", () => {
      assert.strictEqual(Object.keys(SCENE_BUTTON_MAPS.LZW30).length, 15);
      assert.strictEqual(Object.keys(SCENE_BUTTON_MAPS.LZW31).length, 15);
      assert.strictEqual(Object.keys(SCENE_BUTTON_MAPS.LZW36).length, 18);
      assert.strictEqual(Object.keys(SCENE_BUTTON_MAPS.LZW45).length, 15);
    });
  });
});
