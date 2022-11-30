module.exports = function (RED) {
  const util = require("./lib/util.js")
  function InovelliSceneManager(config) {

    RED.nodes.createNode(this, config);
    var node = this;
    const { zwave, nodeid, entityid, switchtype, outputs, passthrough } = config;
    this.zwave = zwave;
    this.nodeid = nodeid;
    this.entityid = entityid;
    this.switchtype = switchtype;
    this.outputs = outputs;
    this.passthrough = passthrough;

    node.on("input", (msg, send, done) => {
      const {
        zwave,
        nodeid,
        entityid,
        switchtype,
        outputs,
        passthrough,
      } = node;
      const payload = msg.payload;
      const domain = payload.event.domain;
      const event_type = payload.event_type;
      const ids = nodeid.split(',').map(item => item.trim());
      const event_types = {
        zwave_js: "zwave_js_value_notification",
        zha: "zha_event",
      };
      var err;

      function validateDomain(preset, incoming) {
        if (preset !== incoming) {
          err = `Incorrect Home Assistant Integration. Node is set for ${preset} but recieved an event for ${incoming}`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      };
      function validateEventType() {
        if (event_types[domain] !== event_type) {
          let correctType = event_types[domain];
          err = `Incorrect Event Type Recieved. Node is set for ${domain} which expects an event type of ${correctType}`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      };

      function validateMessage() {
        if (passthrough) {
          return true
        }
        if (payload.event.node_id && ids.includes((payload.event.node_id.trim()).toString())) {
          return true
        }
        if (payload.event.device_id && ids.includes(payload.event.device_id.trime())) {
          return true
        }
        return false
      };

      validateDomain(zwave, domain);
      validateEventType();

      if (!validateMessage) {
        return
      }

      var button, press;
      var output = new Array(outputs);
      switch (domain) {
        case "zwave_js":
          button = parseInt(payload.event.property_key);
          press = parseInt(payload.event.value_raw);
          break;
        case "zha":
          button = parseInt(payload.event.params.button_pressed);
          press = parseInt(payload.event.params.press_type);
          break;
        case "z2m":
          button = parseInt(payload.event.scene_id);
          press = parseInt(payload.event.scene_value_id);
          break;
      };

      const map = util.ButtonMap[switchtype];

      if (map[button] === undefined || map[button][press] === undefined) {
        return
      };

      if (entityid) {
        msg.entity_id = entityid;
      };
      output[map[button][press]] = msg;

      send(output);
    });
  };
  RED.nodes.registerType("inovelli-scene-manager", InovelliSceneManager);
};
