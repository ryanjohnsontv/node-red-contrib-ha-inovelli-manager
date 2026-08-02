import { parseSecondsValue } from "./shared/duration";
import { entityIds } from "./shared/types";
import { resolveConfigSwitch, ConfigPropertyDef, ConfigPropertyKey } from "./shared/config-params";

interface ConfigProperty {
  property: ConfigPropertyKey;
  value: number | string;
}

interface ConfigManagerConfig {
  name: string;
  entityid: string;
  switchtype: string;
  properties?: ConfigProperty[];
  multicast: boolean;
}

function resolvePropertyValue(propDef: ConfigPropertyDef, rawValue: number | string): number {
  if (propDef.type === "duration") {
    return parseSecondsValue(rawValue, propDef.max ?? 32767);
  }
  if (propDef.type === "number") {
    // Z-Wave config parameters are integers - round before validating/sending.
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

    node.entityid = config.entityid;
    node.switchtype = config.switchtype;
    node.multicast = config.multicast;
    node.properties = Array.isArray(config.properties) ? config.properties : [];

    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload || {};
      const entityid = payload.entity_id || node.entityid;
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

      // Union of configured properties and any property keys present
      // directly on the payload, matching the same ad-hoc-override behavior
      // as LED Manager and Notification Manager.
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
          continue; // Not applicable to the currently selected switch type.
        }
        const configured = node.properties.find((p: ConfigProperty) => p.property === property);
        const rawValue = payload[property] ?? configured?.value;
        if (rawValue === undefined) {
          continue;
        }

        try {
          const value = resolvePropertyValue(propDef, rawValue);
          statusParts.push(`${propDef.label}: ${value}`);
          send(value, propDef.param);
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
        const data = multicast
          ? { ...entityIds(entityid), property: parameter, command_class: 112, value }
          : { ...entityIds(entityid), parameter, value };
        node.send({
          payload: {
            action: `zwave_js.${multicast ? "multicast_set_value" : "set_config_parameter"}`,
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
