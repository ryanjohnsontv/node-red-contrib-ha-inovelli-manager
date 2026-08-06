import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import {
  resolveLedSwitch,
  resolveNotificationSwitch,
  resolveSceneSwitch,
  SCENE_BUTTON_MAPS,
} from "../nodes/shared/switches";
import { resolveConfigSwitch } from "../nodes/shared/config-params";
function switchtypeOptionValues(fileName: string): string[] {
  const html = fs.readFileSync(path.join(__dirname, "..", "nodes", fileName), "utf8");
  const selectMatch = html.match(/<select[^>]*id="node-input-switchtype"[^>]*>([\s\S]*?)<\/select>/);
  if (!selectMatch) {
    throw new Error(`Could not find the switchtype <select> in ${fileName}`);
  }
  const optionMatches = [...selectMatch[1].matchAll(/<option value="([^"]+)"/g)];
  assert.ok(optionMatches.length > 0, `Found no <option> values in ${fileName}'s switchtype select`);
  return optionMatches.map((m) => m[1]);
}
function switchtypeOptionProtocols(fileName: string): Record<string, string> {
  const html = fs.readFileSync(path.join(__dirname, "..", "nodes", fileName), "utf8");
  const selectMatch = html.match(/<select[^>]*id="node-input-switchtype"[^>]*>([\s\S]*?)<\/select>/);
  if (!selectMatch) {
    throw new Error(`Could not find the switchtype <select> in ${fileName}`);
  }
  const optionMatches = [...selectMatch[1].matchAll(/<option value="([^"]+)" data-protocol="([^"]+)"/g)];
  const byValue: Record<string, string> = {};
  for (const [, value, protocol] of optionMatches) {
    byValue[value] = protocol;
  }
  return byValue;
}
describe("editor <-> registry consistency", () => {
  it("every LED Manager Switch Type option resolves", () => {
    for (const value of switchtypeOptionValues("led-manager.html")) {
      assert.doesNotThrow(() => resolveLedSwitch(value), `resolveLedSwitch("${value}") threw`);
      const def = resolveLedSwitch(value);
      assert.ok(Object.keys(def.params).length > 0, `resolveLedSwitch("${value}") has no params`);
    }
  });
  it("every Notification Manager Switch Type option resolves", () => {
    for (const value of switchtypeOptionValues("notification-manager.html")) {
      assert.doesNotThrow(
        () => resolveNotificationSwitch(value),
        `resolveNotificationSwitch("${value}") threw`
      );
    }
  });
  it("every Scene Manager Switch Type option has a button map", () => {
    const protocolByValue = switchtypeOptionProtocols("scene-manager.html");
    for (const value of switchtypeOptionValues("scene-manager.html")) {
      if (protocolByValue[value] === "zigbee" || protocolByValue[value] === "matter") {
        continue;
      }
      const map = SCENE_BUTTON_MAPS[value as keyof typeof SCENE_BUTTON_MAPS];
      assert.ok(map && Object.keys(map).length > 0, `SCENE_BUTTON_MAPS["${value}"] is missing or empty`);
    }
  });
  it("every Blue Series Scene Manager Switch Type option resolves to a non-empty Zigbee action list", () => {
    const byValue = switchtypeOptionProtocols("scene-manager.html");
    const blueValues = Object.entries(byValue)
      .filter(([, protocol]) => protocol === "zigbee")
      .map(([value]) => value);
    assert.ok(blueValues.length > 0, "Found no Blue Series (zigbee) options in scene-manager.html");
    for (const value of blueValues) {
      const def = resolveSceneSwitch(value);
      assert.strictEqual(
        def.protocol,
        "zigbee",
        `resolveSceneSwitch("${value}").protocol should be "zigbee"`
      );
      assert.ok(
        def.protocol === "zigbee" && def.actions.length > 0,
        `resolveSceneSwitch("${value}") has no actions`
      );
    }
  });
  it("every White Series Scene Manager Switch Type option resolves to protocol matter", () => {
    const byValue = switchtypeOptionProtocols("scene-manager.html");
    const whiteValues = Object.entries(byValue)
      .filter(([, protocol]) => protocol === "matter")
      .map(([value]) => value);
    assert.ok(whiteValues.length > 0, "Found no White Series (matter) options in scene-manager.html");
    for (const value of whiteValues) {
      assert.doesNotThrow(() => resolveSceneSwitch(value), `resolveSceneSwitch("${value}") threw`);
      const def = resolveSceneSwitch(value);
      assert.strictEqual(
        def.protocol,
        "matter",
        `resolveSceneSwitch("${value}").protocol should be "matter"`
      );
    }
  });
  it("every Scene Manager Switch Type option's data-protocol matches its resolved protocol", () => {
    const byValue = switchtypeOptionProtocols("scene-manager.html");
    assert.ok(Object.keys(byValue).length > 0, "Found no data-protocol attributes in scene-manager.html");
    for (const [value, protocol] of Object.entries(byValue)) {
      const def = resolveSceneSwitch(value);
      assert.strictEqual(
        def.protocol,
        protocol,
        `resolveSceneSwitch("${value}").protocol (${def.protocol}) does not match data-protocol="${protocol}"`
      );
    }
  });
  it("every Config Manager Switch Type option resolves with at least one property", () => {
    for (const value of switchtypeOptionValues("config-manager.html")) {
      assert.doesNotThrow(() => resolveConfigSwitch(value), `resolveConfigSwitch("${value}") threw`);
      const def = resolveConfigSwitch(value);
      assert.ok(Object.keys(def.properties).length > 0, `resolveConfigSwitch("${value}") has no properties`);
    }
  });
  it("every Config Manager Switch Type option's data-protocol matches its resolved protocol", () => {
    const byValue = switchtypeOptionProtocols("config-manager.html");
    assert.ok(Object.keys(byValue).length > 0, "Found no data-protocol attributes in config-manager.html");
    for (const [value, protocol] of Object.entries(byValue)) {
      const def = resolveConfigSwitch(value);
      assert.strictEqual(
        def.protocol,
        protocol,
        `resolveConfigSwitch("${value}").protocol (${def.protocol}) does not match data-protocol="${protocol}"`
      );
    }
  });
  it("every LED Manager Switch Type option's data-protocol matches its resolved protocol", () => {
    const byValue = switchtypeOptionProtocols("led-manager.html");
    assert.ok(Object.keys(byValue).length > 0, "Found no data-protocol attributes in led-manager.html");
    for (const [value, protocol] of Object.entries(byValue)) {
      const def = resolveLedSwitch(value);
      assert.strictEqual(
        def.protocol,
        protocol,
        `resolveLedSwitch("${value}").protocol (${def.protocol}) does not match data-protocol="${protocol}"`
      );
    }
  });
  it("every Notification Manager Switch Type option's data-protocol matches its resolved protocol", () => {
    const byValue = switchtypeOptionProtocols("notification-manager.html");
    assert.ok(
      Object.keys(byValue).length > 0,
      "Found no data-protocol attributes in notification-manager.html"
    );
    for (const [value, protocol] of Object.entries(byValue)) {
      const def = resolveNotificationSwitch(value);
      assert.strictEqual(
        def.protocol,
        protocol,
        `resolveNotificationSwitch("${value}").protocol (${def.protocol}) does not match data-protocol="${protocol}"`
      );
    }
  });
});
