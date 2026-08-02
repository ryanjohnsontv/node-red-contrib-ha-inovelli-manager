import { parseColor, rgbToHue } from "./shared/color";
import { parseDuration } from "./shared/duration";
import {
  buildTarget,
  legacyEntityIdField,
  legacyEntityTargets,
  resolveTargets,
  TargetEntry,
} from "./shared/targets";
import { resolveNotificationSwitch } from "./shared/switches";
interface NotificationManagerConfig {
  name: string;
  entityid: string;
  targets?: TargetEntry[];
  color: number;
  brightness: number;
  duration: number | string;
  effect: number | string;
  switchtype: string | number;
  clear: boolean;
  multicast: boolean;
}
function effectName(value: number, effects: Record<string, number>): string {
  const found = Object.entries(effects).find(([, num]) => num === value);
  return found ? found[0] : String(value);
}
function resolveEffect(effect: number | string, effects: Record<string, number>): number {
  if (isNaN(effect as number)) {
    const key = String(effect).toLowerCase();
    if (!(key in effects)) {
      throw new Error(`Incorrect Effect: ${effect}. Valid effects are: ${Object.keys(effects).join(", ")}`);
    }
    return effects[key];
  }
  const value = Number(effect);
  if (!Object.values(effects).includes(value)) {
    throw new Error(
      `Incorrect Effect: ${effect}. Valid effect values are: ${Object.values(effects).join(", ")}`
    );
  }
  return value;
}
module.exports = function (RED: any) {
  function InovelliNotificationManager(this: any, config: NotificationManagerConfig): void {
    RED.nodes.createNode(this, config);
    const node = this;
    const hasCurrentTargets = Array.isArray(config.targets) && config.targets.length > 0;
    node.targets = hasCurrentTargets ? config.targets : legacyEntityTargets(config.entityid);
    node.color = Number(config.color);
    node.brightness = Number(config.brightness);
    node.duration = config.duration;
    node.effect = config.effect;
    node.switchtype = config.switchtype;
    node.clear = config.clear;
    node.multicast = config.multicast;
    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload || {};
      const targets = resolveTargets(node.targets, payload.entity_id);
      const clear = payload.clear !== undefined ? payload.clear : node.clear;
      const multicast = payload.multicast !== undefined ? payload.multicast : node.multicast;
      function fail(message: string): void {
        if (done) {
          done(message);
        } else {
          node.error(message);
        }
      }
      try {
        const switchDef = resolveNotificationSwitch(payload.switchtype ?? node.switchtype);
        const service = multicast ? "multicast_set_value" : "bulk_set_partial_config_parameters";
        let value: number;
        if (switchDef.format === "pixelEffect") {
          if (clear) {
            throw new Error("Clear Notification is not supported for Pixel Effect.");
          }
          const effect = resolveEffect(payload.effect ?? node.effect, switchDef.effects);
          const brightness = Math.round(Number(payload.brightness ?? node.brightness));
          if (brightness < 0 || brightness > 10) {
            throw new Error(
              `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10.`
            );
          }
          const intensity = Math.min(Math.round(brightness * 10), 99);
          value = effect + intensity * 256;
          node.status(`Pixel Effect: ${effectName(effect, switchDef.effects)}, Intensity: ${brightness}`);
        } else if (clear) {
          value = 65536;
          node.status("Cleared notification!");
        } else {
          const rgb = parseColor(payload.color ?? node.color, "Notification");
          const { hue, keyword } = rgbToHue(rgb);
          const duration = parseDuration(payload.duration ?? node.duration);
          const effect = resolveEffect(payload.effect ?? node.effect, switchDef.effects);
          const brightness = Math.round(Number(payload.brightness ?? node.brightness));
          if (brightness < 0 || brightness > 10) {
            throw new Error(
              `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10.`
            );
          }
          const scaledBrightness =
            switchDef.param === 21 ? Math.min(Math.round(brightness * 10), 99) : brightness;
          value = hue + scaledBrightness * 256 + duration * 65536 + effect * 16777216;
          node.status(
            `Color: ${keyword}, Brightness: ${brightness}, Effect: ${effectName(effect, switchDef.effects)}, Duration: ${duration}`
          );
        }
        const { target } = buildTarget(targets);
        function sendNotification(parameter: number): void {
          const data = multicast ? { property: parameter, command_class: 112, value } : { parameter, value };
          node.send({
            ...legacyEntityIdField(target),
            payload: { action: `zwave_js.${service}`, ...(target ? { target } : {}), data },
          });
        }
        if (switchDef.isCombo) {
          sendNotification(24);
          sendNotification(25);
        } else {
          sendNotification(switchDef.param);
        }
        if (done) {
          done();
        }
      } catch (err) {
        fail((err as Error).message);
      }
    });
  }
  RED.nodes.registerType("inovelli-notification-manager", InovelliNotificationManager);
};
