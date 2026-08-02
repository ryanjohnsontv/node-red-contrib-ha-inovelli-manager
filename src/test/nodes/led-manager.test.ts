import * as assert from "assert";
import helper = require("node-red-node-test-helper");
const ledManagerNode = require("../../nodes/led-manager.js");
helper.init(require.resolve("node-red"));
describe("inovelli-led-manager", () => {
  afterEach((done) => {
    helper.unload().then(() => done());
  });
  it("sends set_config_parameter for each configured property", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "5",
        properties: [
          { property: "color", value: 0 },
          { property: "brightness", value: 7 },
        ],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      const received: any[] = [];
      n2.on("input", (msg: any) => {
        received.push(msg);
        if (received.length === 2) {
          try {
            const byParam = Object.fromEntries(
              received.map((m) => [m.payload.data.parameter, m.payload.data.value])
            );
            assert.strictEqual(byParam[5], 0);
            assert.strictEqual(byParam[6], 7);
            assert.strictEqual(received[0].payload.action, "zwave_js.set_config_parameter");
            assert.deepStrictEqual(received[0].payload.target, { entity_id: ["light.test"] });
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("honors a payload override for a property not in the configured list", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "38",
        properties: [{ property: "color", value: 0 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      const received: any[] = [];
      n2.on("input", (msg: any) => {
        received.push(msg);
        if (received.length === 2) {
          try {
            const byParam = Object.fromEntries(
              received.map((m) => [m.payload.data.parameter, m.payload.data.value])
            );
            assert.strictEqual(byParam[20], 0);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ payload: { fanColor: 0 } });
    });
  });
  it("uses multicast_set_value when multicast is enabled", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "5",
        properties: [{ property: "brightness", value: 3 }],
        multicast: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.action, "zwave_js.multicast_set_value");
          assert.strictEqual(msg.payload.data.property, 6);
          assert.strictEqual(msg.payload.data.command_class, 112);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("synthesizes properties from a pre-1.0 legacy config", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "13",
        toggleColor: true,
        color: 100,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 13);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("warns once when falling back to a legacy config so the migration is visible", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "13",
        toggleColor: true,
        color: 100,
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:warn", (call: any) => {
        if (/Migrated legacy color\/brightness/.test(call.args[0])) {
          done();
        }
      });
    });
  });
  it("does not error on a legacy config with string color/brightness values (matches real flow JSON)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "5",
        toggleColor: true,
        color: "180",
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        done(new Error(`node.error was called unexpectedly: ${call.args[0]}`));
      });
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 5);
          assert.strictEqual(msg.payload.data.value, 128);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("does not warn when the node already has current-format properties and targets lists", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        targets: [{ type: "entity_id", value: "light.test" }],
        switchtype: "5",
        properties: [{ property: "color", value: 0 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      let warned = false;
      n1.on("call:warn", () => {
        warned = true;
      });
      setTimeout(() => {
        assert.strictEqual(warned, false);
        done();
      }, 50);
    });
  });
  it("reports every property sent this run in a single combined status, not just the last one", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "38",
        properties: [
          { property: "color", value: 0 },
          { property: "brightness", value: 7 },
          { property: "fanBrightness", value: 3 },
        ],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:status", (call: any) => {
        try {
          const text = call.args[0];
          assert.match(text, /Color: /);
          assert.match(text, /Brightness: 7/);
          assert.match(text, /Fan Brightness: 3/);
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
        type: "inovelli-led-manager",
        entityid: "light.test",
        switchtype: "5",
        properties: [{ property: "brightness", value: 5 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.value, 8);
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
        type: "inovelli-led-manager",
        entityid: "light.a, light.b",
        switchtype: "5",
        properties: [{ property: "brightness", value: 3 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
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
  it("does not warn about targets when the node already has a current-format targets list", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.stale",
        targets: [{ type: "entity_id", value: "light.current" }],
        switchtype: "5",
        properties: [{ property: "brightness", value: 3 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      let warnedAboutTargets = false;
      n1.on("call:warn", (call: any) => {
        if (/Migrated legacy entity ID/.test(call.args[0])) {
          warnedAboutTargets = true;
        }
      });
      setTimeout(() => {
        assert.strictEqual(warnedAboutTargets, false);
        done();
      }, 50);
    });
  });
  it("sends every configured target type (entity/device/area/floor/label) together", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        targets: [
          { type: "entity_id", value: "light.kitchen" },
          { type: "device_id", value: "abc123" },
          { type: "area_id", value: "kitchen" },
          { type: "floor_id", value: "first_floor" },
          { type: "label_id", value: "outdoor" },
        ],
        switchtype: "5",
        properties: [{ property: "brightness", value: 3 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.payload.target, {
            entity_id: ["light.kitchen"],
            device_id: ["abc123"],
            area_id: ["kitchen"],
            floor_id: ["first_floor"],
            label_id: ["outdoor"],
          });
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("replaces only entity targets on a payload.entity_id override, leaving device/area targets intact", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        targets: [
          { type: "entity_id", value: "light.configured" },
          { type: "area_id", value: "kitchen" },
        ],
        switchtype: "5",
        properties: [{ property: "brightness", value: 3 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
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
