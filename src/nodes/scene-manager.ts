import { SCENE_BUTTON_MAPS, SceneSwitchType, resolveSceneSwitch } from "./shared/switches";
import { parseFriendlyNames } from "./shared/zigbee";
import { resolveWhiteSceneSwitch } from "./shared/white-switches";
interface MsgField {
  name: string;
  value: string;
}
interface EntityRole {
  role: string;
  entityId: string;
}
interface SceneManagerConfig {
  name: string;
  nodeid: string;
  friendlyNames?: string;
  entityid: string;
  fields?: MsgField[];
  entityRoles?: EntityRole[];
  switchtype: string;
  outputs: number;
  passthrough: boolean;
  singleOutput: boolean;
}
module.exports = function (RED: any) {
  function InovelliSceneManager(this: any, config: SceneManagerConfig): void {
    RED.nodes.createNode(this, config);
    const node = this;
    node.nodeid = config.nodeid;
    node.friendlyNames = parseFriendlyNames(config.friendlyNames);
    node.switchtype = config.switchtype;
    node.outputs = Number(config.outputs);
    node.passthrough = config.passthrough;
    node.singleOutput = config.singleOutput;
    node.entityRoles = Array.isArray(config.entityRoles) ? config.entityRoles : [];
    const hasCurrentFields = Array.isArray(config.fields) && config.fields.length > 0;
    node.fields = hasCurrentFields
      ? config.fields
      : config.entityid
        ? [{ name: "entity_id", value: config.entityid }]
        : [];
    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload;
      function fail(message: string): void {
        if (done) {
          done(message);
        } else {
          node.error(message);
        }
      }
      function applyFields(): void {
        const groupedFields = new Map<string, string[]>();
        for (const field of node.fields as MsgField[]) {
          if (!field.name) {
            continue;
          }
          const values = groupedFields.get(field.name) ?? [];
          values.push(field.value);
          groupedFields.set(field.name, values);
        }
        for (const [name, values] of groupedFields) {
          msg[name] = values.length > 1 ? values : values[0];
        }
      }
      function sendMatch(matchedIndex: number, extraFields?: Record<string, unknown>): void {
        if (node.singleOutput) {
          msg.topic = matchedIndex;
          if (extraFields) {
            Object.assign(msg, extraFields);
          }
          node.send(msg);
        } else {
          const output = new Array(node.outputs);
          output[matchedIndex] = msg;
          node.send(output);
        }
      }
      const isZwaveEvent = !!payload && payload.event_type === "zwave_js_value_notification";
      const isZigbeeAction =
        !isZwaveEvent &&
        typeof msg.topic === "string" &&
        msg.topic.endsWith("/action") &&
        typeof msg.payload === "string";
      if (isZigbeeAction) {
        const friendlyName = msg.topic.split("/")[1];
        if (!node.passthrough && !node.friendlyNames.includes(friendlyName)) {
          if (done) {
            done();
          }
          return;
        }
        let sceneDef;
        try {
          sceneDef = resolveSceneSwitch(node.switchtype);
        } catch (err) {
          fail((err as Error).message);
          return;
        }
        if (sceneDef.protocol !== "zigbee") {
          const otherProtocolLabel =
            sceneDef.protocol === "matter" ? "White Series (Matter)" : "Red Series (Z-Wave)";
          fail(
            `Switch Type ${node.switchtype} is a ${otherProtocolLabel} switch type, but this message came from a Zigbee2MQTT action topic. Configure a Blue Series switch type (e.g. VZM31-SN) to process Zigbee2MQTT action messages.`
          );
          return;
        }
        const action = msg.payload;
        applyFields();
        const matchedIndex = sceneDef.actions.indexOf(action);
        if (matchedIndex === -1) {
          if (done) {
            done();
          }
          return;
        }
        sendMatch(matchedIndex, { action });
        if (done) {
          done();
        }
        return;
      }
      const isMatterEvent =
        !isZwaveEvent &&
        !isZigbeeAction &&
        !!payload &&
        payload.event_type === "state_changed" &&
        !!payload.event &&
        typeof payload.event.entity_id === "string" &&
        !!resolveWhiteSceneSwitch(node.switchtype);
      if (isMatterEvent) {
        const entityId = payload.event.entity_id;
        const eventType = payload.event.new_state?.attributes?.event_type;
        if (eventType === undefined) {
          fail(
            `Entity ${entityId}'s new_state has no 'event_type' attribute - is this really a Matter button/event entity?`
          );
          return;
        }
        const configuredRole = (node.entityRoles as EntityRole[]).find((r) => r.entityId === entityId);
        let role: string;
        if (configuredRole) {
          role = configuredRole.role;
        } else if (node.passthrough) {
          role = entityId;
        } else {
          if (done) {
            done();
          }
          return;
        }
        const action = `${role}_${eventType}`;
        applyFields();
        msg.topic = action;
        msg.button = role;
        msg.action = action;
        node.send(msg);
        if (done) {
          done();
        }
        return;
      }
      if (!isZwaveEvent) {
        fail(
          `Incorrect Event Type Received: ${payload?.event_type}. Connect this node to a Home Assistant "events: all" node filtered to zwave_js_value_notification events (Red Series) or state_changed events from a Matter button/event entity (White Series), or a core "mqtt in" node subscribed to a Zigbee2MQTT action topic ending in "/action" (Blue Series).`
        );
        return;
      }
      const nodeIds = node.nodeid ? String(node.nodeid).split(",").map(Number) : [];
      const eventNodeId = parseInt(payload.event.node_id, 10);
      if (!node.passthrough && !nodeIds.includes(eventNodeId)) {
        if (done) {
          done();
        }
        return;
      }
      const buttonMap = SCENE_BUTTON_MAPS[node.switchtype as SceneSwitchType];
      if (!buttonMap) {
        fail(`Incorrect Switch Type: ${node.switchtype}`);
        return;
      }
      const button = parseInt(payload.event.property_key, 10);
      const scene = parseInt(payload.event.value_raw, 10);
      applyFields();
      let matchedIndex = -1;
      for (const key of Object.keys(buttonMap)) {
        const i = Number(key);
        if (button === buttonMap[i].button && scene === buttonMap[i].scene) {
          matchedIndex = i;
          break;
        }
      }
      if (matchedIndex === -1) {
        if (done) {
          done();
        }
        return;
      }
      sendMatch(matchedIndex, { button, scene });
      if (done) {
        done();
      }
    });
  }
  RED.nodes.registerType("inovelli-scene-manager", InovelliSceneManager);
};
