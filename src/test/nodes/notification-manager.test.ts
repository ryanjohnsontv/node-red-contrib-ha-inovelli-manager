import * as assert from "assert";
import helper = require("node-red-node-test-helper");
const notificationManagerNode = require("../../nodes/notification-manager.js");
helper.init(require.resolve("node-red"));
describe("inovelli-notification-manager", () => {
  afterEach((done) => {
    helper.unload().then(() => done());
  });
  it("computes the bitpacked value for an LZW30-SN notification", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "8",
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 4,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.action, "zwave_js.bulk_set_partial_config_parameters");
          assert.strictEqual(msg.payload.data.parameter, 8);
          assert.strictEqual(msg.payload.data.value, 0 + 5 * 256 + 10 * 65536 + 4 * 16777216);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("scales brightness to LZW45's native 0-99 intensity range on parameter 21", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "21",
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 2,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 21);
          assert.strictEqual(msg.payload.data.value, 0 + 50 * 256 + 10 * 65536 + 2 * 16777216);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("fans the legacy 49 (LZW36 fan+light) switch type out to params 24 and 25", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "49",
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 2,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      const params: number[] = [];
      n2.on("input", (msg: any) => {
        params.push(msg.payload.data.parameter);
        if (params.length === 2) {
          try {
            assert.deepStrictEqual(params.sort(), [24, 25]);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sends the clear value when clear is set", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "16",
        clear: true,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.value, 65536);
          assert.strictEqual(msg.payload.data.parameter, 16);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("reports color, brightness, effect, and duration together in status", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: 8,
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 4,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:status", (call: any) => {
        try {
          const text = call.args[0];
          assert.match(text, /Color: /);
          assert.match(text, /Brightness: 5/);
          assert.match(text, /Effect: pulse/);
          assert.match(text, /Duration: 10/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("computes effect + intensity*256 for LZW45 Pixel Effect (parameter 31)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "31",
        brightness: 5,
        effect: "rainbow",
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 31);
          assert.strictEqual(msg.payload.data.value, 10 + 50 * 256);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("reports the pixel effect name and intensity in status", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "31",
        brightness: 5,
        effect: "rainbow",
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:status", (call: any) => {
        try {
          assert.match(call.args[0], /Pixel Effect: rainbow/);
          assert.match(call.args[0], /Intensity: 5/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rejects Clear Notification for LZW45 Pixel Effect", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: "31",
        clear: true,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /not supported for Pixel Effect/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rounds a fractional brightness payload override to the nearest integer", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.test",
        switchtype: 8,
        color: 0,
        duration: 10,
        effect: 4,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.value, 0 + 8 * 256 + 10 * 65536 + 4 * 16777216);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { brightness: 7.6 } });
    });
  });
  it("migrates a legacy entityid-only config to a targets list and warns once", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        entityid: "light.a, light.b",
        switchtype: 8,
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 4,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let warned = false;
      n1.on("call:warn", (call: any) => {
        if (/Migrated legacy entity ID/.test(call.args[0])) {
          warned = true;
        }
      });
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.payload.target, { entity_id: ["light.a", "light.b"] });
          assert.strictEqual(warned, true);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sends every configured target type together and lets a payload.entity_id override replace only entity targets", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-notification-manager",
        targets: [
          { type: "entity_id", value: "light.configured" },
          { type: "area_id", value: "kitchen" },
        ],
        switchtype: 8,
        color: 0,
        brightness: 5,
        duration: 10,
        effect: 4,
        clear: false,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(notificationManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.payload.target, {
            area_id: ["kitchen"],
            entity_id: ["light.override"],
          });
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { entity_id: "light.override" } });
    });
  });
});
