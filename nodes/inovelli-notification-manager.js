module.exports = function (RED) {
  const util = require('./lib/util.js')
  function InovelliNotificationManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const {
      zwave,
      entityid,
      color,
      brightness,
      duration,
      effect,
      switchtype,
      clear,
      multicast,
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.color = parseInt(color, 10);
    this.brightness = parseInt(brightness, 10);
    this.duration = parseInt(duration, 10);
    this.effect = parseInt(effect, 10);
    this.switchtype = parseInt(switchtype, 10);
    this.clear = clear;
    this.multicast = multicast;

    node.on("input", (msg, send, done) => {
      const {
        zwave: presetZwave,
        entityid,
        color: presetColor,
        brightness: presetBrightness,
        duration: presetDuration,
        effect: presetEffect,
        switchtype: presetSwitchtype,
        clear: presetClear,
        multicast: presetMulticast,
      } = node;

      const payload = msg.payload || {};
      const domain = payload.zwave || presetZwave;
      const brightness = payload.brightness || presetBrightness;
      var color = payload.color || presetColor;
      var duration = payload.duration || presetDuration;
      var effect = payload.effect || presetEffect;
      var parameter = payload.switchtype || presetSwitchtype;
      const clear = payload.clear != undefined ? payload.clear : presetClear;
      const multicast =
        payload.multicast != undefined ? payload.multicast : presetMulticast;
      var service;
      const group =
        payload.group != undefined ? payload.group : presetMulticast;

      sendZWaveNotification = (parameter, value, id) => {
        switch (service) {
          case "multicast_set_value":
            send({
              payload: {
                domain,
                service,
                data: { ...id, property: parameter, command_class: 112, value },
              },
            });
            break;
          default:
            send({
              payload: {
                domain,
                service,
                data: { ...id, parameter, value },
              },
            });
            break;
        };
      };

      sendZHANotification = () => {
        switch (service) {
          case "":
            send({
              payload: {
                domain,
                service,
                data: {
                  ieee,
                  endpoint_id: 1,
                  cluster_id: 25,
                  cluster_type: out,
                  command: 0,
                  command_type: client,
                  args: [
                    - effect
                    - color
                    - brightness
                    - duration
                  ],
                },
              },
            });
            break;
          default:
            break;
        }
      };

      switch (domain) {
        case "zwave_js":
          send({ payload: parameter })
          parameter = util.zWaveSwitchConvert(parameter);
          send({ payload: parameter })
          color = util.colorConvert(color);
          util.brightnessCheck(brightness, 10);
          duration = util.durationConvert(duration);
          effect = util.zwaveEffectConvert(effect, parameter);
          service = multicast ? "multicast_set_value" : "bulk_set_partial_config_parameters";

          var id;
          var value = util.calculateValue(node, domain, color, brightness, effect, duration, clear);
          const entity_id = payload.entity_id || entityid;
          id = entity_id ? { entity_id } : {};
          switch (parameter) {
            case 49:
              sendZWaveNotification(24, value, id);
              sendZWaveNotification(25, value, id);
              break;
            default:
              sendZWaveNotification(parameter, value, id);
              break;
          };
          break;
        case "zha":
          service = group ? "" : "zha.issue_zigbee_cluster_command";
          sendZHANotification()
          break;
        case "z2m":
          break;
        default:
          return done(Error(`Invalid Home Assistant Integration: ${domain}`))
      };
    });
  }
  RED.nodes.registerType(
    "inovelli-notification-manager",
    InovelliNotificationManager
  );
};
