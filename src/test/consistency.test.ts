import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";
import { resolveLedSwitch, resolveNotificationSwitch, SCENE_BUTTON_MAPS } from "../nodes/shared/switches";
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
    for (const value of switchtypeOptionValues("scene-manager.html")) {
      const map = SCENE_BUTTON_MAPS[value as keyof typeof SCENE_BUTTON_MAPS];
      assert.ok(map && Object.keys(map).length > 0, `SCENE_BUTTON_MAPS["${value}"] is missing or empty`);
    }
  });
  it("every Config Manager Switch Type option resolves with at least one property", () => {
    for (const value of switchtypeOptionValues("config-manager.html")) {
      assert.doesNotThrow(() => resolveConfigSwitch(value), `resolveConfigSwitch("${value}") threw`);
      const def = resolveConfigSwitch(value);
      assert.ok(Object.keys(def.properties).length > 0, `resolveConfigSwitch("${value}") has no properties`);
    }
  });
});
