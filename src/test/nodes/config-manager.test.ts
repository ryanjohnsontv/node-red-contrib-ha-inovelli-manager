import * as assert from "assert";
import helper = require("node-red-node-test-helper");
const configManagerNode = require("../../nodes/config-manager.js");
helper.init(require.resolve("node-red"));
describe("inovelli-config-manager", () => {
  afterEach((done) => {
    helper.unload().then(() => done());
  });
  it("sets Auto-Off Timer (LZW30-SN, parameter 3) from a friendly duration string", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "autoOffTimer", value: "10 minutes" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.action, "zwave_js.set_config_parameter");
          assert.strictEqual(msg.payload.data.parameter, 3);
          assert.strictEqual(msg.payload.data.value, 600);
          assert.deepStrictEqual(msg.payload.target, { entity_id: ["switch.test"] });
          assert.deepStrictEqual(msg.entity_id, ["switch.test"]);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets Power On State (LZW30-SN, parameter 1) by name", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "powerOnState", value: "on" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 1);
          assert.strictEqual(msg.payload.data.value, 1);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("uses the LZW36 fan-specific Auto-Off Timer (parameter 11), not the light one (10)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW36",
        properties: [{ property: "autoOffFanTimer", value: 120 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 11);
          assert.strictEqual(msg.payload.data.value, 120);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets Local Protection (LZW36, parameter 31)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW36",
        properties: [{ property: "localProtection", value: "both" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 31);
          assert.strictEqual(msg.payload.data.value, 3);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rejects Power On State on a switch type that doesn't have it (LZW31-SN)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW31-SN",
        properties: [],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      let called = false;
      n2.on("input", () => {
        called = true;
      });
      n1.receive({ payload: { powerOnState: "on" } });
      setTimeout(() => {
        assert.strictEqual(called, false);
        done();
      }, 50);
    });
  });
  it("uses multicast_set_value when multicast is enabled", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "autoOffTimer", value: 60 }],
        multicast: true,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.action, "zwave_js.multicast_set_value");
          assert.strictEqual(msg.payload.data.property, 3);
          assert.strictEqual(msg.payload.data.command_class, 112);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets a plain 'number' type property (Active Power Reports, parameter 10 on LZW30-SN)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "activePowerReports", value: 25 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 10);
          assert.strictEqual(msg.payload.data.value, 25);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rejects a 'number' type property outside its 0-100 range", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "activePowerReports", value: 150 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Must be between 0 and 100/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("uses the LZW36 fan-specific LED Strip Timeout (parameter 27), not the light one (26)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW36",
        properties: [{ property: "ledStripTimeoutFan", value: 5 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 27);
          assert.strictEqual(msg.payload.data.value, 5);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets LZW45's State After Power Failure (parameter 10, its own distinct property from Power On State)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "light.strip_test",
        switchtype: "LZW45",
        properties: [{ property: "stateAfterPowerFailure", value: "default color/level" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 10);
          assert.strictEqual(msg.payload.data.value, 1);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets Instant On (LZW30-SN, parameter 51) - Enabled maps to 0", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [{ property: "instantOn", value: "enabled" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 51);
          assert.strictEqual(msg.payload.data.value, 0);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("uses the LZW36 fan-specific Minimum/Maximum Fan Level (parameters 7/8), not the light ones (5/6)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW36",
        properties: [
          { property: "minFanLevel", value: 10 },
          { property: "maxFanLevel", value: 90 },
        ],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
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
            assert.strictEqual(byParam[7], 10);
            assert.strictEqual(byParam[8], 90);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("uses LZW31-SN's Dimming Speed (Z-Wave) at parameter 1 with its own 0-100 range", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW31-SN",
        properties: [{ property: "dimmingSpeedZwave", value: "5 seconds" }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 1);
          assert.strictEqual(msg.payload.data.value, 5);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sets Light Brightness After Power Restored (LZW36, parameter 16)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW36",
        properties: [{ property: "brightnessAfterPowerRestored", value: 100 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 16);
          assert.strictEqual(msg.payload.data.value, 100);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rounds a fractional 'number' type payload override to the nearest integer", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.test",
        switchtype: "LZW30-SN",
        properties: [],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.value, 26);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { activePowerReports: 25.5 } });
    });
  });
  it("migrates a legacy entityid-only config to a targets list and warns once", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-config-manager",
        entityid: "switch.a, switch.b",
        switchtype: "LZW30-SN",
        properties: [{ property: "autoOffTimer", value: 60 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
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
          assert.deepStrictEqual(msg.payload.target, { entity_id: ["switch.a", "switch.b"] });
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
        type: "inovelli-config-manager",
        targets: [
          { type: "entity_id", value: "switch.configured" },
          { type: "area_id", value: "hallway" },
        ],
        switchtype: "LZW30-SN",
        properties: [{ property: "autoOffTimer", value: 60 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(configManagerNode, flow, () => {
      const n2 = helper.getNode("n2");
      const n1 = helper.getNode("n1");
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.payload.target, {
            area_id: ["hallway"],
            entity_id: ["switch.override"],
          });
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { entity_id: "switch.override" } });
    });
  });
});
