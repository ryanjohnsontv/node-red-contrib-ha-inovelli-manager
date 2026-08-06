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
            assert.deepStrictEqual(received[0].entity_id, ["light.test"]);
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
  it("migrates a legacy color/brightness config silently, with no warning", (done) => {
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
      let warned = false;
      n1.on("call:warn", () => {
        warned = true;
      });
      n2.on("input", (msg: any) => {
        try {
          assert.strictEqual(msg.payload.data.parameter, 13);
          assert.strictEqual(warned, false);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
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
  it("migrates a legacy entityid-only config to a targets list silently, with no warning", (done) => {
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
      n1.on("call:warn", () => {
        warned = true;
      });
      n2.on("input", (msg: any) => {
        try {
          assert.deepStrictEqual(msg.payload.target, { entity_id: ["light.a", "light.b"] });
          assert.strictEqual(warned, false);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
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
          assert.deepStrictEqual(msg.entity_id, ["light.kitchen"]);
          assert.strictEqual(msg.device_id, undefined);
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
  it("supports overriding every target type (entity_id, device_id, area_id, floor_id, label_id) independently via payload", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        targets: [
          { type: "entity_id", value: "light.configured" },
          { type: "area_id", value: "kitchen" },
          { type: "floor_id", value: "first_floor" },
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
            entity_id: ["light.configured"],
            area_id: ["office"],
            floor_id: ["first_floor"],
            device_id: ["abc123", "def456"],
            label_id: ["outdoor"],
          });
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({
        payload: { area_id: "office", device_id: ["abc123", "def456"], label_id: "outdoor" },
      });
    });
  });
  it("sends a Blue Series (VZM31-SN) color property as a {topic, payload} MQTT message", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "color", value: 0 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Kitchen Dimmer/set/ledColorWhenOn");
          assert.strictEqual(msg.payload, 0);
          assert.strictEqual(msg.entity_id, undefined);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("accepts a Blue Series brightness value in its native 0-100 range", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "brightness", value: 75 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Kitchen Dimmer/set/ledIntensityWhenOn");
          assert.strictEqual(msg.payload, 75);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rejects a Blue Series brightness value outside its native 0-100 range", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "brightness", value: 150 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Please enter a value between 0 and 100/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("fans out a Blue Series property to every configured friendly name as separate messages", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer, Hallway Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "brightness", value: 50 }],
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
            assert.deepStrictEqual(received.map((m) => m.topic).sort(), [
              "zigbee2mqtt/Hallway Dimmer/set/ledIntensityWhenOn",
              "zigbee2mqtt/Kitchen Dimmer/set/ledIntensityWhenOn",
            ]);
            done();
          } catch (err) {
            done(err);
          }
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("lets a payload.friendly_name override replace the configured friendly names for one run", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "brightness", value: 50 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Office Dimmer/set/ledIntensityWhenOn");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { friendly_name: "Office Dimmer" } });
    });
  });
  it("sends a segment-specific property topic when Segment is set to an individual LED (1-7)", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        segment: 3,
        properties: [{ property: "color", value: 0 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Kitchen Dimmer/set/defaultLed3ColorWhenOn");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sends the correct property topic for every segment 1-7, including brightnessOff", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "brightnessOff", value: 1 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      const n2 = helper.getNode("n2");
      let segment = 1;
      const checkNext = (): void => {
        if (segment > 7) {
          done();
          return;
        }
        const expectedSegment = segment;
        n2.once("input", (msg: any) => {
          try {
            assert.strictEqual(
              msg.topic,
              `zigbee2mqtt/Kitchen Dimmer/set/defaultLed${expectedSegment}IntensityWhenOff`
            );
            segment += 1;
            checkNext();
          } catch (err) {
            done(err);
          }
        });
        n1.receive({ payload: { segment: expectedSegment } });
      };
      checkNext();
    });
  });
  it("uses the global (segment 0) topic by default, regression check against segment behavior", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "color", value: 0 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Kitchen Dimmer/set/ledColorWhenOn");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("also uses the global topic when segment is explicitly set to 0", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        segment: 0,
        properties: [{ property: "brightness", value: 50 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Kitchen Dimmer/set/ledIntensityWhenOn");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("rejects an out-of-range segment value with a clear error", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Kitchen Dimmer",
        switchtype: "VZM31-SN",
        properties: [{ property: "color", value: 0 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /Invalid segment value/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { segment: 8 } });
    });
  });
  it("ignores a Segment override for VZM36, which has no individually-addressable segments", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Fan Canopy",
        switchtype: "VZM36",
        properties: [{ property: "color", value: 0 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Fan Canopy/set/ledColorWhenOn_1");
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: { segment: 3 } });
    });
  });
  it("sends a VZM36 (Fan Canopy Module) color property to its ledColorWhenOn_1 topic", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Fan Canopy",
        switchtype: "VZM36",
        properties: [{ property: "color", value: 0 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Fan Canopy/set/ledColorWhenOn_1");
          assert.strictEqual(msg.payload, 0);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("sends a VZM36 (Fan Canopy Module) brightness property to its ledIntensityWhenOn_1 topic", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Fan Canopy",
        switchtype: "VZM36",
        properties: [{ property: "brightness", value: 60 }],
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
          assert.strictEqual(msg.topic, "zigbee2mqtt/Fan Canopy/set/ledIntensityWhenOn_1");
          assert.strictEqual(msg.payload, 60);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
  it("silently skips colorOff/brightnessOff for VZM36, which has no 'when off' properties", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "Fan Canopy",
        switchtype: "VZM36",
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
      });
      n1.receive({ payload: { colorOff: 10, brightnessOff: 5 } });
      setTimeout(() => {
        try {
          // Only the configured "color" property should have been sent - colorOff/brightnessOff
          // aren't in VZM36's params map at all, so they're silently skipped, matching how
          // Red Series LZW30-SN already skips "fanColor" today.
          assert.strictEqual(received.length, 1);
          assert.strictEqual(received[0].topic, "zigbee2mqtt/Fan Canopy/set/ledColorWhenOn_1");
          done();
        } catch (err) {
          done(err);
        }
      }, 20);
    });
  });
  it("errors clearly on a Blue Series switch type with no Friendly Name(s) configured", (done) => {
    const flow = [
      {
        id: "n1",
        type: "inovelli-led-manager",
        friendlyNames: "",
        switchtype: "VZM30-SN",
        properties: [{ property: "brightness", value: 50 }],
        multicast: false,
        wires: [["n2"]],
      },
      { id: "n2", type: "helper" },
    ];
    helper.load(ledManagerNode, flow, () => {
      const n1 = helper.getNode("n1");
      n1.on("call:error", (call: any) => {
        try {
          assert.match(call.args[0], /No Friendly Name\(s\) configured/);
          done();
        } catch (err) {
          done(err);
        }
      });
      n1.receive({ payload: {} });
    });
  });
});
