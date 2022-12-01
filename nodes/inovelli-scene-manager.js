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

      validateEvent = (expected) => {
        if (typeof payload !== 'object' || payload === null) {
          return done(Error('Payload does not contain event data.'));
        }
        if (!('event_type' in payload)) {
          return done(Error('Event Type not provided in payload.'));
        };
        if (!('event' in payload)) {
          return done(Error('Event Data not provided in payload.'));
        };
        if (!('domain' in payload.event)) {
          return done(Error('No domain value provided in msg.event.'));
        };
        
        var domain = payload.event.domain;
        if (zwave !== domain) {
          return done(Error(`Incorrect Home Assistant Integration. Node is set for ${zwave} but recieved an event for ${domain}`));
        };

        var incoming = payload.event_type;
        if (zwave !== domain) {
          return done(Error(`Incorrect Home Assistant Integration. Node is set for ${zwave} but recieved an event for ${domain}`));
        };
        if (incoming !== expected) {
          return done(Error(`Incorrect Event Type Recieved: ${incoming}. Node is set for ${zwave} which expects an event type of ${expected}`));
        };
      };


      validateMessage = () => {
        const ids = nodeid.split(',').map(item => item.trim());
        if (passthrough) {
          return true
        };
        if (payload.event.node_id && ids.includes((payload.event.node_id.trim()).toString())) {
          return true
        };
        if (payload.event.device_id && ids.includes(payload.event.device_id.trime())) {
          return true
        };
        return false
      };

      Z2MMapping = () => {
        var map = util.Z2MButtonMap
        var index = map[switchtype].indexOf(payload)
        if (index === -1) {
          return done(Error(`Invalid Payload Recieved`));
        };
        return index;
      };

      var output = new Array(outputs);
      switch (zwave) {
        case "zwave_js":
          if (!validateMessage) {
            return
          };
          validateEvent("zwave_js_value_notification")
          var button = parseInt(payload.event.property_key);
          var press = parseInt(payload.event.value_raw);
          var map = util.ZWaveButtonMap[switchtype];
          if (map[button] === undefined || map[button][press] === undefined) {
            return done(Error(`Invalid Event for the provided switch`))
          };
          output = sendMsg(map[button][press])
          break;
        case "zha":
          if (!validateMessage) {
            return
          };
          validateEvent("zha_event")
          var button = parseInt(payload.event.params.button_pressed);
          var press = parseInt(payload.event.params.press_type);
          var map = util.ZWaveButtonMap[switchtype];
          if (map[button] === undefined || map[button][press] === undefined) {
            return done(Error(`Invalid Event for the provided switch`))
          };
          output = sendMsg(map[button][press])
          break;
        case "z2m":
          var map = util.Z2MButtonMap
          var index = map[switchtype].indexOf(payload)
          if (index === -1) {
            return done(Error(`Invalid Payload Recieved`))
          };
          output = sendMsg(index)
          break;
      }

      function sendMsg(val) {
        if (entityid) {
          msg.entity_id = entityid;
        };
        output[val] = msg;
        node.status(util.OutputLabels[switchtype][val])
        return output;
      };

      send(output);
    });
  };
  RED.nodes.registerType("inovelli-scene-manager", InovelliSceneManager);
};
