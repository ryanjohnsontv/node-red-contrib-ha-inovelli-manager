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
import { parseFriendlyNames, resolveFriendlyNames, buildZigbeeMsg } from "./shared/zigbee";
import { blueLedSegmentProperty, BLUE_LED_SEGMENT_SWITCHTYPES } from "./shared/blue-switches";
interface LedManagerConfig extends LegacyLedConfig {
  name: string;
  entityid: string;
  switchtype: string | number;
  properties?: LedProperty[];
  targets?: TargetEntry[];
  friendlyNames?: string;
  segment?: number;
  multicast: boolean;
}
const PROPERTY_LABELS: Record<LedPropertyKey, string> = {
  color: "Color",
  colorOff: "Color (Off)",
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
    const hasCurrentTargets = Array.isArray(config.targets) && config.targets.length > 0;
    node.targets = hasCurrentTargets ? config.targets : legacyEntityTargets(config.entityid);
    node.friendlyNames = parseFriendlyNames(config.friendlyNames);
    node.segment = Number(config.segment ?? 0);
    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload || {};
      const targets = resolveTargets(node.targets, payload);
      const friendlyNames = resolveFriendlyNames(node.friendlyNames, payload.friendly_name);
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
      let segment = 0;
      if (switchDef.protocol === "zigbee") {
        const segmentRaw = payload.segment ?? node.segment;
        segment = Math.round(Number(segmentRaw));
        if (isNaN(segment) || segment < 0 || segment > 7) {
          fail(`Invalid segment value: ${segmentRaw}. Please enter a value between 0 (global) and 7.`);
          return;
        }
        const segmentCapableAliases = BLUE_LED_SEGMENT_SWITCHTYPES.map((s) => s.toLowerCase());
        const supportsSegments = switchDef.aliases.some(
          (alias) => typeof alias === "string" && segmentCapableAliases.includes(alias)
        );
        if (!supportsSegments) {
          // e.g. VZM36, whose single status LED has no individually-addressable segments at all.
          segment = 0;
        }
      }
      const propertyKeys = new Set<LedPropertyKey>(node.properties.map((p: LedProperty) => p.property));
      for (const key of Object.keys(payload) as LedPropertyKey[]) {
        if (key in switchDef.params) {
          propertyKeys.add(key);
        }
      }
      const statusParts: string[] = [];
      for (const property of propertyKeys) {
        const param = segment > 0 ? blueLedSegmentProperty(property, segment) : switchDef.params[property];
        if (param === undefined) {
          continue;
        }
        const configured = node.properties.find((p: LedProperty) => p.property === property);
        const rawValue = payload[property] ?? configured?.value;
        if (rawValue === undefined) {
          continue;
        }
        try {
          let value: number;
          const segmentSuffix = segment > 0 ? ` (Segment ${segment})` : "";
          if (property === "color" || property === "colorOff" || property === "fanColor") {
            const rgb = parseColor(rawValue, property);
            const { hue, keyword } = rgbToHue(rgb);
            value = hue;
            statusParts.push(`${PROPERTY_LABELS[property]}: ${keyword}${segmentSuffix}`);
          } else {
            const maxBrightness = switchDef.protocol === "zigbee" ? 100 : 10;
            const brightness = Math.round(Number(rawValue));
            if (brightness < 0 || brightness > maxBrightness) {
              throw new Error(
                `Invalid brightness value for ${property}: ${brightness}. Please enter a value between 0 and ${maxBrightness}.`
              );
            }
            value = brightness;
            statusParts.push(`${PROPERTY_LABELS[property]}: ${brightness}${segmentSuffix}`);
          }
          if (switchDef.protocol === "zigbee") {
            if (friendlyNames.length === 0) {
              throw new Error(
                "No Friendly Name(s) configured. Set Friendly Name(s) or msg.payload.friendly_name."
              );
            }
            for (const friendlyName of friendlyNames) {
              node.send(buildZigbeeMsg(friendlyName, String(param), value));
            }
          } else {
            send(value, param as number);
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
