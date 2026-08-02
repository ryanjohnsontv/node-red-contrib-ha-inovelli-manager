import { SCENE_BUTTON_MAPS, SceneSwitchType } from "./shared/switches";

interface SceneManagerConfig {
  name: string;
  nodeid: string;
  entityid: string;
  switchtype: SceneSwitchType;
  outputs: number;
  passthrough: boolean;
  singleOutput: boolean;
}

module.exports = function (RED: any) {
  function InovelliSceneManager(this: any, config: SceneManagerConfig): void {
    RED.nodes.createNode(this, config);
    const node = this;

    node.nodeid = config.nodeid;
    node.entityid = config.entityid;
    node.switchtype = config.switchtype;
    node.outputs = Number(config.outputs);
    node.passthrough = config.passthrough;
    node.singleOutput = config.singleOutput;

    node.on("input", (msg: any, _send: any, done: any) => {
      const payload = msg.payload;

      function fail(message: string): void {
        if (done) {
          done(message);
        } else {
          node.error(message);
        }
      }

      if (!payload || payload.event_type !== "zwave_js_value_notification") {
        fail(
          `Incorrect Event Type Received: ${payload?.event_type}. Connect this node to a Home Assistant "events: all" node filtered to zwave_js_value_notification events.`
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

      if (node.entityid) {
        msg.entity_id = node.entityid;
      }

      // The number of button/scene entries for this switch type is the
      // source of truth for how many combinations exist - not node.outputs,
      // which in single-output mode is always 1 regardless of switch type.
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
        return; // No button/scene combination in the map matched this event.
      }

      if (node.singleOutput) {
        msg.topic = matchedIndex;
        msg.button = button;
        msg.scene = scene;
        node.send(msg);
      } else {
        const output = new Array(node.outputs);
        output[matchedIndex] = msg;
        node.send(output);
      }

      if (done) {
        done();
      }
    });
  }
  RED.nodes.registerType("inovelli-scene-manager", InovelliSceneManager);
};
