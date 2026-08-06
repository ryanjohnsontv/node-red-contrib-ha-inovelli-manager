import * as assert from "assert";
import helper = require("node-red-node-test-helper");
const sceneManagerNode = require("../../nodes/scene-manager.js");
helper.init(require.resolve("node-red"));
function wiresFor(outputCount: number, index: number, targetId: string): string[][] {
  const wires = Array.from({ length: outputCount }, () => [] as string[]);
  wires[index] = [targetId];
  return wires;
}
describe("inovelli-scene-manager", () => {
  afterEach((done) => {
    helper.unload().then(() => done());
  });
  it("routes a matching node_id/button/scene to the right output", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.event.node_id, 5);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("ignores events for a node_id it isn't configured for", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let called = false;
      n2.on("input", () => {
        called = true;
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 99, property_key: 2, value_raw: 0 },
        },
      });
      setTimeout(() => {
        assert.strictEqual(called, false);
        done();
      }, 50);
    });
  });
  it("supports LZW45 button mapping", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW45",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.event.node_id, 5);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 1 },
        },
      });
    });
  });
  it("errors on a non zwave_js_value_notification event", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Incorrect Event Type/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { event_type: "some_other_event", event: {} } });
    });
  });
  it("routes LZW36's 18-output button map correctly (button 1, scene 0 -> index 9)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "20",
        entityid: "",
        switchtype: "LZW36",
        outputs: 18,
        passthrough: false,
        wires: wiresFor(18, 9, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.event.node_id, 20);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 20, property_key: 1, value_raw: 0 },
        },
      });
    });
  });
  it("passthrough routes a matching button/scene regardless of node_id", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: true,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.event.node_id, 999);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 999, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("single output mode sends one message with msg.topic/button/scene instead of routing to a wire", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 1,
        passthrough: false,
        singleOutput: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.topic, 0);
          assert.strictEqual(msg.button, 2);
          assert.strictEqual(msg.scene, 0);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("single output mode stays silent when no button/scene combination matches", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 1,
        passthrough: false,
        singleOutput: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let called = false;
      n2.on("input", () => {
        called = true;
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 99, value_raw: 99 },
        },
      });
      setTimeout(() => {
        assert.strictEqual(called, false);
        done();
      }, 50);
    });
  });
  it("migrates a legacy entityid-only config to a single msg.entity_id field silently, with no warning", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "light.a, light.b",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let warned = false;
      n1.on("call:warn", () => {
        warned = true;
      });
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.entity_id, "light.a, light.b");
          assert.strictEqual(warned, false);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("sets every configured msg field, by whatever name is given", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        fields: [
          { name: "entity_id", value: "light.kitchen" },
          { name: "zone", value: "downstairs" },
          { name: "customField", value: "abc123" },
        ],
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.entity_id, "light.kitchen");
          assert.strictEqual(msg.zone, "downstairs");
          assert.strictEqual(msg.customField, "abc123");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("combines fields sharing the same name into an array", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        fields: [
          { name: "entity_id", value: "light.kitchen" },
          { name: "entity_id", value: "light.bedroom" },
          { name: "zone", value: "downstairs" },
        ],
        switchtype: "LZW30",
        outputs: 15,
        passthrough: false,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.entity_id, ["light.kitchen", "light.bedroom"]);
          assert.strictEqual(msg.zone, "downstairs");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "zwave_js_value_notification",
          event: { node_id: 5, property_key: 2, value_raw: 0 },
        },
      });
    });
  });
  it("routes matching Blue Series actions + friendly name to the correct output index (down_single=0, up_single=7, config_single=14 per BLUE_SCENE_ACTIONS ordering)", (done) => {
    const outputs = 42;
    const wires: string[][] = Array.from({ length: outputs }, () => [] as string[]);
    wires[0] = ["n2"];
    wires[7] = ["n2"];
    wires[14] = ["n2"];
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs,
        passthrough: false,
        wires,
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      const received: string[] = [];
      n2.on("input", (msg: any) => {
        received.push(msg.payload);
        if (received.length === 3) {
          try {
            assert.deepStrictEqual(received, ["down_single", "up_single", "config_single"]);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "down_single" });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "up_single" });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "config_single" });
    });
  });
  it("ignores a Blue Series action from an unconfigured friendly name (passthrough off)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs: 42,
        passthrough: false,
        wires: wiresFor(42, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let called = false;
      n2.on("input", () => {
        called = true;
      });
      n1.receive({ topic: "zigbee2mqtt/Other Switch/action", payload: "down_single" });
      setTimeout(() => {
        assert.strictEqual(called, false);
        done();
      }, 50);
    });
  });
  it("processes a Blue Series action from any friendly name when passthrough is on", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs: 42,
        passthrough: true,
        wires: wiresFor(42, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload, "down_single");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ topic: "zigbee2mqtt/Other Switch/action", payload: "down_single" });
    });
  });
  it("single output mode sets msg.topic and msg.action for a Blue Series action", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs: 1,
        passthrough: false,
        singleOutput: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.topic, 7);
          assert.strictEqual(msg.action, "up_single");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "up_single" });
    });
  });
  it("errors clearly when the incoming msg matches neither the Z-Wave nor Zigbee2MQTT shape", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs: 42,
        passthrough: false,
        wires: wiresFor(42, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Incorrect Event Type/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ foo: "bar" });
    });
  });
  it("errors clearly when a Red Series switch type receives a Zigbee2MQTT-shaped message", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: true,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Red Series \(Z-Wave\) switch type/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "down_single" });
    });
  });
  it("routes a matching White Series entity_id/event_type to msg.button/msg.action/msg.topic", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "VTM31-SN",
        entityRoles: [{ role: "up", entityId: "event.kitchen_switch_button_up" }],
        outputs: 1,
        passthrough: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.button, "up");
          assert.strictEqual(msg.action, "up_multi_press_2");
          assert.strictEqual(msg.topic, "up_multi_press_2");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "event.kitchen_switch_button_up",
            new_state: {
              state: "2024-01-01T00:00:00.000+00:00",
              attributes: { event_type: "multi_press_2" },
            },
            old_state: null,
          },
        },
      });
    });
  });
  it("ignores a White Series event from an unconfigured entity_id (passthrough off)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "VTM31-SN",
        entityRoles: [{ role: "up", entityId: "event.kitchen_switch_button_up" }],
        outputs: 1,
        passthrough: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let called = false;
      n2.on("input", () => {
        called = true;
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "event.other_button",
            new_state: {
              state: "2024-01-01T00:00:00.000+00:00",
              attributes: { event_type: "initial_press" },
            },
            old_state: null,
          },
        },
      });
      setTimeout(() => {
        assert.strictEqual(called, false);
        done();
      }, 50);
    });
  });
  it("processes a White Series event from any entity_id when passthrough is on, falling back to the entity_id as the role", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "VTM31-SN",
        entityRoles: [{ role: "up", entityId: "event.kitchen_switch_button_up" }],
        outputs: 1,
        passthrough: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.button, "event.other_button");
          assert.strictEqual(msg.action, "event.other_button_initial_press");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "event.other_button",
            new_state: {
              state: "2024-01-01T00:00:00.000+00:00",
              attributes: { event_type: "initial_press" },
            },
            old_state: null,
          },
        },
      });
    });
  });
  it("errors clearly when a matched White Series entity's new_state has no event_type attribute", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "VTM31-SN",
        entityRoles: [{ role: "up", entityId: "event.kitchen_switch_button_up" }],
        outputs: 1,
        passthrough: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /has no 'event_type' attribute/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "event.kitchen_switch_button_up",
            new_state: { state: "2024-01-01T00:00:00.000+00:00", attributes: {} },
            old_state: null,
          },
        },
      });
    });
  });
  it("errors clearly when a White Series switch type receives a Zigbee2MQTT-shaped message", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        switchtype: "VTM31-SN",
        outputs: 1,
        passthrough: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /White Series \(Matter\) switch type/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ topic: "zigbee2mqtt/Kitchen Switch/action", payload: "down_single" });
    });
  });
  it("a Red Series switch type receiving an unrelated Home Assistant state_changed event gets the generic error, not a Matter-specific one (regression)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        nodeid: "5",
        entityid: "",
        switchtype: "LZW30",
        outputs: 15,
        passthrough: true,
        wires: wiresFor(15, 0, "n2"),
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Incorrect Event Type Received: state_changed/);
          assert.doesNotMatch(call.args[0], /is this really a Matter button\/event entity/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "sensor.temperature",
            new_state: { state: "72", attributes: {} },
            old_state: { state: "71", attributes: {} },
          },
        },
      });
    });
  });
  it("a Blue Series switch type receiving an unrelated Home Assistant state_changed event gets the generic error, not a Matter-specific one (regression)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-scene-manager",
        friendlyNames: "Kitchen Switch",
        switchtype: "VZM31-SN",
        outputs: 1,
        passthrough: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(sceneManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Incorrect Event Type Received: state_changed/);
          assert.doesNotMatch(call.args[0], /is this really a Matter button\/event entity/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: {
          event_type: "state_changed",
          event: {
            entity_id: "light.kitchen",
            new_state: { state: "on", attributes: {} },
            old_state: { state: "off", attributes: {} },
          },
        },
      });
    });
  });
});
