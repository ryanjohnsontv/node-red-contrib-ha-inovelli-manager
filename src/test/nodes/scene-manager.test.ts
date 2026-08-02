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
});
