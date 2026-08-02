import { parseColor, rgbToHue } from "./shared/color";
import {
  buildTarget,
  legacyEntityIdField,
  legacyEntityTargets,
  resolveTargets,
  TargetEntry,
} from "./shared/targets";
import { resolveLedSwitch, LedPropertyKey } from "./shared/switches";
import { legacyLedProperties, LedProperty, LegacyLedConfig } from "./led-manager.migrations";
interface LedManagerConfig extends LegacyLedConfig {
  name: string;
  entityid: string;
  switchtype: string | number;
  properties?: LedProperty[];
  targets?: TargetEntry[];
  multicast: boolean;
}
const PROPERTY_LABELS: Record<LedPropertyKey, string> = {
  color: "Color",
  brightness: "Brightness",
  brightnessOff: "Brightness (Off)",
  fanColor: "Fan Color",
  fanBrightness: "Fan Brightness",
  fanBrightnessOff: "Fan Brightness (Off)",
};
module.exports = function (RED: any) {
  function InovelliLedManager(this: any, config: LedManagerConfig): void {
    RED.nodes.createNode(this, config);
    const node = this;
    node.switchtype = config.switchtype;
    node.multicast = config.multicast;
    const hasCurrentProperties = Array.isArray(config.properties) && config.properties.length > 0;
    node.properties = hasCurrentProperties ? config.properties : legacyLedProperties(config);
    if (!hasCurrentProperties && node.properties.length > 0) {
      node.warn(
        `Migrated legacy color/brightness config to the new "properties" list automatically ` +
          `(${node.properties.length} propert${node.properties.length === 1 ? "y" : "ies"}). ` +
          `Re-open and save this node in the editor to persist the new format.`
      );
    }
    const hasCurrentTargets = Array.isArray(config.targets) && config.targets.length > 0;
    node.targets = hasCurrentTargets ? config.targets : legacyEntityTargets(config.entityid);
    if (!hasCurrentTargets && node.targets.length > 0) {
      node.warn(
        `Migrated legacy entity ID config to the new "targets" list automatically ` +
          `(${node.targets.length} target${node.targets.length === 1 ? "" : "s"}). ` +
          `Re-open and save this node in the editor to persist the new format.`
      );
    }
    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload || {};
      const targets = resolveTargets(node.targets, payload.entity_id);
      const switchtype = payload.switchtype ?? node.switchtype;
      const multicast = payload.multicast !== undefined ? payload.multicast : node.multicast;
      function fail(message: string): void {
        if (done) {
          done(message);
        } else {
          node.error(message);
        }
      }
      let switchDef;
      try {
        switchDef = resolveLedSwitch(switchtype);
      } catch (err) {
        fail((err as Error).message);
        return;
      }
      const propertyKeys = new Set<LedPropertyKey>(node.properties.map((p: LedProperty) => p.property));
      for (const key of Object.keys(payload) as LedPropertyKey[]) {
        if (key in switchDef.params) {
          propertyKeys.add(key);
        }
      }
      const statusParts: string[] = [];
      for (const property of propertyKeys) {
        const param = switchDef.params[property];
        if (param === undefined) {
          continue;
        }
        const configured = node.properties.find((p: LedProperty) => p.property === property);
        const rawValue = payload[property] ?? configured?.value;
        if (rawValue === undefined) {
          continue;
        }
        try {
          if (property === "color" || property === "fanColor") {
            const rgb = parseColor(rawValue, property);
            const { hue, keyword } = rgbToHue(rgb);
            statusParts.push(`${PROPERTY_LABELS[property]}: ${keyword}`);
            send(hue, param);
          } else {
            const brightness = Math.round(Number(rawValue));
            if (brightness < 0 || brightness > 10) {
              throw new Error(
                `Invalid brightness value for ${property}: ${brightness}. Please enter a value between 0 and 10.`
              );
            }
            statusParts.push(`${PROPERTY_LABELS[property]}: ${brightness}`);
            send(brightness, param);
          }
        } catch (err) {
          if (statusParts.length > 0) {
            node.status(statusParts.join(", "));
          }
          fail((err as Error).message);
          return;
        }
      }
      if (statusParts.length > 0) {
        node.status(statusParts.join(", "));
      }
      function send(value: number, parameter: number): void {
        const data = multicast ? { property: parameter, command_class: 112, value } : { parameter, value };
        const { target } = buildTarget(targets);
        node.send({
          ...legacyEntityIdField(target),
          payload: {
            action: `zwave_js.${multicast ? "multicast_set_value" : "set_config_parameter"}`,
            ...(target ? { target } : {}),
            data,
          },
        });
      }
      if (done) {
        done();
      }
    });
  }
  RED.nodes.registerType("inovelli-led-manager", InovelliLedManager);
};
