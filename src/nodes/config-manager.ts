import { parseSecondsValue } from "./shared/duration";
import {
  buildTarget,
  legacyEntityIdField,
  legacyEntityTargets,
  resolveTargets,
  TargetEntry,
} from "./shared/targets";
import { resolveConfigSwitch, ConfigPropertyDef, ConfigPropertyKey } from "./shared/config-params";
import { parseFriendlyNames, resolveFriendlyNames, buildZigbeeMsg } from "./shared/zigbee";
interface ConfigProperty {
  property: ConfigPropertyKey;
  value: number | string;
}
interface ConfigManagerConfig {
  name: string;
  entityid: string;
  targets?: TargetEntry[];
  friendlyNames?: string;
  switchtype: string;
  properties?: ConfigProperty[];
  multicast: boolean;
}
function resolvePropertyValue(propDef: ConfigPropertyDef, rawValue: number | string): number | string {
  if (propDef.type === "duration") {
    return parseSecondsValue(rawValue, propDef.max ?? 32767);
  }
  if (propDef.type === "number") {
    const value = Math.round(Number(rawValue));
    const min = propDef.min ?? 0;
    const max = propDef.max ?? 100;
    if (isNaN(value) || value < min || value > max) {
      throw new Error(
        `Incorrect value for ${propDef.label}: ${rawValue}. Must be between ${min} and ${max}.`
      );
    }
    return value;
  }
  if (propDef.type === "zigbeeEnum") {
    const enumValues = propDef.enumValues as string[];
    const match = enumValues.find((option) => option.toLowerCase() === String(rawValue).toLowerCase());
    if (!match) {
      throw new Error(
        `Incorrect value for ${propDef.label}: ${rawValue}. Valid options: ${enumValues.join(", ")}`
      );
    }
    return match;
  }
  const options = propDef.options as Record<string, number>;
  if (isNaN(rawValue as number)) {
    const key = String(rawValue).toLowerCase();
    if (!(key in options)) {
      throw new Error(
        `Incorrect value for ${propDef.label}: ${rawValue}. Valid options: ${Object.keys(options).join(", ")}`
      );
    }
    return options[key];
  }
  const value = Number(rawValue);
  if (!Object.values(options).includes(value)) {
    throw new Error(
      `Incorrect value for ${propDef.label}: ${rawValue}. Valid values: ${Object.values(options).join(", ")}`
    );
  }
  return value;
}
module.exports = function (RED: any) {
  function InovelliConfigManager(this: any, config: ConfigManagerConfig): void {
    RED.nodes.createNode(this, config);
    const node = this;
    node.switchtype = config.switchtype;
    node.multicast = config.multicast;
    node.properties = Array.isArray(config.properties) ? config.properties : [];
    const hasCurrentTargets = Array.isArray(config.targets) && config.targets.length > 0;
    node.targets = hasCurrentTargets ? config.targets : legacyEntityTargets(config.entityid);
    node.friendlyNames = parseFriendlyNames(config.friendlyNames);
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
        switchDef = resolveConfigSwitch(switchtype);
      } catch (err) {
        fail((err as Error).message);
        return;
      }
      const propertyKeys = new Set<ConfigPropertyKey>(node.properties.map((p: ConfigProperty) => p.property));
      for (const key of Object.keys(payload) as ConfigPropertyKey[]) {
        if (key in switchDef.properties) {
          propertyKeys.add(key);
        }
      }
      const statusParts: string[] = [];
      for (const property of propertyKeys) {
        const propDef = switchDef.properties[property];
        if (!propDef) {
          continue;
        }
        const configured = node.properties.find((p: ConfigProperty) => p.property === property);
        const rawValue = payload[property] ?? configured?.value;
        if (rawValue === undefined) {
          continue;
        }
        try {
          const value = resolvePropertyValue(propDef, rawValue);
          statusParts.push(`${propDef.label}: ${value}`);
          if (switchDef.protocol === "zigbee") {
            if (friendlyNames.length === 0) {
              throw new Error(
                "No Friendly Name(s) configured. Set Friendly Name(s) or msg.payload.friendly_name."
              );
            }
            for (const friendlyName of friendlyNames) {
              node.send(buildZigbeeMsg(friendlyName, String(propDef.param), value));
            }
          } else {
            send(value as number, propDef.param as number);
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
  RED.nodes.registerType("inovelli-config-manager", InovelliConfigManager);
};
