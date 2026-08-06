import * as assert from "assert";
import { resolveConfigSwitch } from "../../nodes/shared/config-params";
describe("shared/blue-config-params resolveConfigSwitch (Blue Series)", () => {
  it("resolves VZM30-SN as zigbee protocol with its Zigbee2MQTT property names", () => {
    const def = resolveConfigSwitch("vzm30-sn");
    assert.strictEqual(def.protocol, "zigbee");
    assert.strictEqual(def.properties.invertSwitch?.param, "invertSwitch");
    assert.strictEqual(def.properties.autoOffTimer?.param, "autoTimerOff");
    assert.strictEqual(def.properties.switchType?.param, "switchType");
    assert.deepStrictEqual(def.properties.switchType?.enumValues, ["Single Pole", "Aux Switch"]);
    assert.strictEqual(def.properties.oneLedMode?.param, "onOffLedMode");
    assert.strictEqual(def.properties.minimumLevel, undefined);
  });
  it("resolves VZM31-SN's 2-in-1-specific switch type options and dimmer-only properties", () => {
    const def = resolveConfigSwitch("VZM31-SN");
    assert.strictEqual(def.protocol, "zigbee");
    assert.deepStrictEqual(def.properties.switchType?.enumValues, [
      "Single Pole",
      "3-Way Dumb Switch",
      "3-Way Aux Switch",
      "Single-Pole Full Sine Wave",
    ]);
    assert.strictEqual(def.properties.minimumLevel?.param, "minimumLevel");
    assert.strictEqual(def.properties.maximumLevel?.param, "maximumLevel");
    assert.strictEqual(def.properties.levelAfterPowerRestored?.param, "stateAfterPowerRestored");
    assert.strictEqual(def.properties.relayClick?.param, "relayClick");
    assert.strictEqual(def.properties.dimmingSpeedUpRemote?.param, "dimmingSpeedUpRemote");
  });
  it("resolves VZM32-SN's mmWave-only properties", () => {
    const def = resolveConfigSwitch("vzm32-sn");
    assert.strictEqual(def.properties.mmWaveHeightMin?.param, "mmWaveHeightMin");
    assert.strictEqual(def.properties.mmWaveDetectSensitivity?.param, "mmWaveDetectSensitivity");
    assert.deepStrictEqual(def.properties.mmWaveDetectSensitivity?.enumValues, [
      "Low",
      "Medium",
      "High (default)",
    ]);
    assert.strictEqual(def.properties.relayClick, undefined);
  });
  it("resolves VZM35-SN's fan-specific labels while reusing shared property names", () => {
    const def = resolveConfigSwitch("vzm35-sn");
    assert.strictEqual(def.properties.smartBulbMode?.label, "Smart Fan Mode");
    assert.deepStrictEqual(def.properties.smartBulbMode?.enumValues, ["Disabled", "Smart Fan Mode"]);
    assert.strictEqual(def.properties.outputMode?.param, "outputMode");
    assert.deepStrictEqual(def.properties.outputMode?.enumValues, [
      "Ceiling Fan (3-Speed)",
      "Exhaust Fan (On/Off)",
    ]);
    assert.strictEqual(def.properties.mmWaveHeightMin, undefined);
  });
  it("resolves VZM36's separate light/fan endpoint properties", () => {
    const def = resolveConfigSwitch("vzm36");
    assert.strictEqual(def.properties.autoOffTimer?.param, "autoTimerOff_1");
    assert.strictEqual(def.properties.autoOffFanTimer?.param, "autoTimerOff_2");
    assert.strictEqual(def.properties.ledColorWhenOnLight?.param, "ledColorWhenOn_1");
    assert.strictEqual(def.properties.outputModeFan?.param, "outputMode_2");
    assert.strictEqual(def.properties.switchType, undefined);
  });
  it("keeps Red Series entries tagged as zwave protocol (no regression from the protocol field)", () => {
    assert.strictEqual(resolveConfigSwitch("lzw30-sn").protocol, "zwave");
    assert.strictEqual(resolveConfigSwitch("lzw31-sn").protocol, "zwave");
    assert.strictEqual(resolveConfigSwitch("lzw36").protocol, "zwave");
    assert.strictEqual(resolveConfigSwitch("lzw45").protocol, "zwave");
  });
});
