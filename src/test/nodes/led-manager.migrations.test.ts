import * as assert from "assert";
import { legacyLedProperties } from "../../nodes/led-manager.migrations";

describe("shared/led-properties legacyLedProperties", () => {
  it("returns nothing when no legacy toggles are set", () => {
    assert.deepStrictEqual(legacyLedProperties({}), []);
  });

  it("synthesizes a properties list matching the pre-1.0 defaults", () => {
    const legacy = {
      toggleColor: true,
      toggleBrightness: true,
      toggleBrightnessOff: true,
      color: 200,
      brightness: 7,
      brightnessOff: 2,
    };
    assert.deepStrictEqual(legacyLedProperties(legacy), [
      { property: "color", value: 200 },
      { property: "brightness", value: 7 },
      { property: "brightnessOff", value: 2 },
    ]);
  });

  it("falls back to sensible defaults when a legacy value is missing", () => {
    assert.deepStrictEqual(legacyLedProperties({ toggleFanColor: true }), [
      { property: "fanColor", value: 180 },
    ]);
  });

  it("ignores toggles that are false", () => {
    assert.deepStrictEqual(
      legacyLedProperties({ toggleColor: false, toggleFanBrightness: true, fanBrightness: 8 }),
      [{ property: "fanBrightness", value: 8 }]
    );
  });

  // Regression test: pre-1.0 flow JSON stores color/brightness/etc as
  // strings, because the editor's <input type="range"> always serializes to
  // a string (just like the switchtype <select> regression). The legacy
  // constructor used to coerce these with `parseInt(color, 10)`; if this
  // migration function stops coercing too, values get handed downstream as
  // strings and consumers that check `typeof === "number"` (like
  // parseColor's numeric-hue branch) silently take the wrong path, throwing
  // "Incorrect Color" for every existing user with color/fanColor enabled.
  it("coerces legacy string values (as a real saved flow contains) to numbers", () => {
    const legacy = {
      toggleColor: true,
      toggleBrightness: true,
      toggleBrightnessOff: true,
      color: "200",
      brightness: "7",
      brightnessOff: "2",
    } as any;
    const result = legacyLedProperties(legacy);
    assert.deepStrictEqual(result, [
      { property: "color", value: 200 },
      { property: "brightness", value: 7 },
      { property: "brightnessOff", value: 2 },
    ]);
    for (const prop of result) {
      assert.strictEqual(typeof prop.value, "number");
    }
  });

  it("coerces the fallback-default path too when only the string toggle is legacy", () => {
    const result = legacyLedProperties({ toggleFanColor: true } as any);
    assert.strictEqual(typeof result[0].value, "number");
    assert.strictEqual(result[0].value, 180);
  });
});
