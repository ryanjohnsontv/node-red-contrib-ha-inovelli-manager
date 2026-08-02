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
            assert.strictEqual(byParam[5], 0); // color param for LZW30-SN, hue 0 = red
            assert.strictEqual(byParam[6], 7); // brightness param
            assert.strictEqual(received[0].payload.action, "zwave_js.set_config_parameter");
            assert.strictEqual(received[0].payload.data.entity_id, "light.test");
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
            assert.strictEqual(byParam[20], 0); // fanColor param 20, hue 0 == red
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
          assert.strictEqual(msg.payload.data.parameter, 13); // LZW31-SN color param
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
        try {
          assert.match(call.args[0], /Migrated legacy/);
          done();
        } catch (err) {
          done(err);
        }
      });
    });
  });

  // Regression test: a real saved pre-1.0 flow stores color/brightness as
  // strings (the editor's <input type="range"> always serializes to a
  // string), not JS number literals like the test above uses. Without
  // coercion in legacyLedProperties, this string reaches parseColor's
  // typeof-gated branches and takes the wrong path, throwing "Incorrect
  // Color" instead of sending a value - silently breaking every upgraded
  // node that has color or fanColor enabled.
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
          assert.strictEqual(msg.payload.data.parameter, 5); // LZW30-SN color param
          assert.strictEqual(msg.payload.data.value, 128); // hue for 180 (matches pre-rewrite output)
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });

  it("does not warn when the node already has a current-format properties list", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        entityid: "light.test",
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

  // Regression test: node.status() replaces its previous call rather than
  // appending, so calling it once per property (the old behavior) only ever
  // left the LAST property's status visible on the node in the flow editor.
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

  // Regression test: Z-Wave config parameters are integers. A fractional
  // brightness (most likely from a payload override) used to flow straight
  // through to set_config_parameter uncorrected.
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
});
