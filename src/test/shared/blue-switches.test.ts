import * as assert from "assert";
import { blueLedSegmentProperty, BLUE_LED_SWITCH_TYPES } from "../../nodes/shared/blue-switches";
import { resolveLedSwitch } from "../../nodes/shared/switches";
describe("shared/blue-switches", () => {
  describe("blueLedSegmentProperty", () => {
    it("builds the correct Zigbee2MQTT property name for representative property/segment combinations", () => {
      assert.strictEqual(blueLedSegmentProperty("color", 3), "defaultLed3ColorWhenOn");
      assert.strictEqual(blueLedSegmentProperty("colorOff", 3), "defaultLed3ColorWhenOff");
      assert.strictEqual(blueLedSegmentProperty("brightness", 5), "defaultLed5IntensityWhenOn");
      assert.strictEqual(blueLedSegmentProperty("brightnessOff", 5), "defaultLed5IntensityWhenOff");
      assert.strictEqual(blueLedSegmentProperty("color", 1), "defaultLed1ColorWhenOn");
      assert.strictEqual(blueLedSegmentProperty("brightnessOff", 7), "defaultLed7IntensityWhenOff");
    });
    it("returns undefined for segment 0 (caller should use the static params map instead)", () => {
      assert.strictEqual(blueLedSegmentProperty("color", 0), undefined);
      assert.strictEqual(blueLedSegmentProperty("brightness", 0), undefined);
    });
    it("returns undefined for fanColor/fanBrightness/fanBrightnessOff regardless of segment (not applicable to Blue Series)", () => {
      assert.strictEqual(blueLedSegmentProperty("fanColor", 3), undefined);
      assert.strictEqual(blueLedSegmentProperty("fanBrightness", 3), undefined);
      assert.strictEqual(blueLedSegmentProperty("fanBrightnessOff", 3), undefined);
      assert.strictEqual(blueLedSegmentProperty("fanColor", 0), undefined);
    });
  });
  describe("BLUE_LED_SWITCH_TYPES VZM36 entry", () => {
    it("resolves all of VZM36's aliases", () => {
      assert.strictEqual(resolveLedSwitch("vzm36").protocol, "zigbee");
      assert.strictEqual(resolveLedSwitch("VZM36").protocol, "zigbee");
      assert.strictEqual(resolveLedSwitch("blue canopy").protocol, "zigbee");
      assert.strictEqual(resolveLedSwitch("fan canopy module").protocol, "zigbee");
    });
    it("has params shape of exactly {color, brightness}, with no colorOff/brightnessOff keys at all", () => {
      const def = BLUE_LED_SWITCH_TYPES.find((d) => d.aliases.includes("vzm36"));
      assert.ok(def, "expected a VZM36 entry in BLUE_LED_SWITCH_TYPES");
      assert.deepStrictEqual(def!.params, { color: "ledColorWhenOn_1", brightness: "ledIntensityWhenOn_1" });
      assert.strictEqual("colorOff" in def!.params, false);
      assert.strictEqual("brightnessOff" in def!.params, false);
    });
  });
});
