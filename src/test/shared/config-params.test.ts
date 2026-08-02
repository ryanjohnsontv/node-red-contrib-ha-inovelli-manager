import * as assert from "assert";
import { resolveConfigSwitch } from "../../nodes/shared/config-params";

describe("shared/config-params resolveConfigSwitch", () => {
  it("resolves LZW30-SN's parameter numbers", () => {
    const def = resolveConfigSwitch("LZW30-SN");
    assert.strictEqual(def.properties.powerOnState?.param, 1);
    assert.strictEqual(def.properties.invertSwitch?.param, 2);
    assert.strictEqual(def.properties.autoOffTimer?.param, 3);
    assert.strictEqual(def.properties.ledStripTimeout?.param, 9);
    assert.strictEqual(def.properties.activePowerReports?.param, 10);
    assert.strictEqual(def.properties.periodicPowerEnergyReports?.param, 11);
    assert.strictEqual(def.properties.energyReports?.param, 12);
    assert.strictEqual(def.properties.loadType?.param, 13);
    assert.strictEqual(def.properties.instantOn?.param, 51);
    assert.strictEqual(def.properties.localProtection, undefined);
    assert.strictEqual(def.properties.stateAfterPowerFailure, undefined);
  });

  it("resolves LZW31-SN's parameter numbers (Auto-Off Timer is 8, not 3; no Power On State)", () => {
    const def = resolveConfigSwitch("lzw31-sn");
    assert.strictEqual(def.properties.autoOffTimer?.param, 8);
    assert.strictEqual(def.properties.invertSwitch?.param, 7);
    assert.strictEqual(def.properties.ledStripTimeout?.param, 17);
    assert.strictEqual(def.properties.activePowerReports?.param, 18);
    assert.strictEqual(def.properties.periodicPowerEnergyReports?.param, 19);
    assert.strictEqual(def.properties.powerOnState, undefined);
    assert.strictEqual(def.properties.energyReports, undefined); // firmware-dependent units, excluded
    assert.strictEqual(def.properties.instantOn, undefined); // inverted-direction "Button Delay", excluded
  });

  it("resolves LZW36's parameter numbers (separate light/fan Auto-Off Timers and LED Strip Timeouts)", () => {
    const def = resolveConfigSwitch("lzw36");
    assert.strictEqual(def.properties.autoOffTimer?.param, 10);
    assert.strictEqual(def.properties.autoOffFanTimer?.param, 11);
    assert.strictEqual(def.properties.localProtection?.param, 31);
    assert.strictEqual(def.properties.ledStripTimeout?.param, 26);
    assert.strictEqual(def.properties.ledStripTimeoutFan?.param, 27);
    assert.strictEqual(def.properties.activePowerReports?.param, 28);
    assert.strictEqual(def.properties.periodicPowerEnergyReports?.param, 29);
    assert.strictEqual(def.properties.energyReports?.param, 30);
    assert.strictEqual(def.properties.instantOn?.param, 51);
    assert.strictEqual(def.properties.invertSwitch, undefined); // LZW36 has no relay to invert
  });

  it("resolves LZW45's parameter numbers, including its own State After Power Failure", () => {
    const def = resolveConfigSwitch("lzw45");
    assert.strictEqual(def.properties.autoOffTimer?.param, 6);
    assert.strictEqual(def.properties.activePowerReports?.param, 17);
    assert.strictEqual(def.properties.periodicPowerEnergyReports?.param, 18);
    assert.strictEqual(def.properties.stateAfterPowerFailure?.param, 10);
    assert.strictEqual(def.properties.powerOnState, undefined); // different shape, kept as its own property
    assert.strictEqual(def.properties.energyReports, undefined); // range mismatch (0-127 vs 0-100), excluded
    assert.strictEqual(Object.keys(def.properties).length, 4);
  });

  it("throws on an unknown switch type", () => {
    assert.throws(() => resolveConfigSwitch("nope"), /Incorrect Switch Type/);
  });

  it("gives LZW31-SN and LZW36 their own Min/Max Level parameter numbers (they don't collide)", () => {
    const lzw31 = resolveConfigSwitch("lzw31-sn");
    const lzw36 = resolveConfigSwitch("lzw36");
    assert.strictEqual(lzw31.properties.minLevel?.param, 5);
    assert.strictEqual(lzw31.properties.maxLevel?.param, 6);
    assert.strictEqual(lzw36.properties.minLevel?.param, 5);
    assert.strictEqual(lzw36.properties.maxLevel?.param, 6);
    assert.strictEqual(lzw36.properties.minFanLevel?.param, 7);
    assert.strictEqual(lzw36.properties.maxFanLevel?.param, 8);
    assert.strictEqual(lzw31.properties.minFanLevel, undefined); // LZW31-SN has no fan channel
  });

  it("gives LZW36 its own Brightness/Speed After Power Restored (LZW31-SN's equivalent is firmware-ambiguous, excluded)", () => {
    const lzw36 = resolveConfigSwitch("lzw36");
    assert.strictEqual(lzw36.properties.brightnessAfterPowerRestored?.param, 16);
    assert.strictEqual(lzw36.properties.fanSpeedAfterPowerRestored?.param, 17);
    const lzw31 = resolveConfigSwitch("lzw31-sn");
    assert.strictEqual(lzw31.properties.brightnessAfterPowerRestored, undefined);
  });

  it("gives LZW31-SN and LZW36 their own Dimming Speed/Ramp Rate parameter numbers with per-model max values", () => {
    const lzw31 = resolveConfigSwitch("lzw31-sn");
    const lzw36 = resolveConfigSwitch("lzw36");
    assert.strictEqual(lzw31.properties.dimmingSpeedZwave?.param, 1);
    assert.strictEqual(lzw31.properties.dimmingSpeedZwave?.max, 100);
    assert.strictEqual(lzw36.properties.dimmingSpeedZwave?.param, 1);
    assert.strictEqual(lzw36.properties.dimmingSpeedZwave?.max, 98); // different max than LZW31-SN
    assert.strictEqual(lzw31.properties.rampRateManual?.param, 4);
    assert.strictEqual(lzw36.properties.rampRateManual?.param, 4);
  });
});
