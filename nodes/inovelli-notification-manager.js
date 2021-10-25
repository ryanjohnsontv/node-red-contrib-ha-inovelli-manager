module.exports = function (RED) {
  const convert = require("color-convert");
  function InovelliNotificationManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const {
      zwave,
      entityid,
      nodeid,
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
    this.nodeid = nodeid;
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
        nodeid,
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
      var parameter, service, err;

      function inputSwitchConvert(parameter) {
        if (isNaN(parameter)) {
          parameter = parameter.toLowerCase();
        }
        if (["switch", "lzw30", "lzw30-sn", "on/off", 8].includes(parameter)) {
          parameter = 8;
        } else if (["dimmer", "lzw31", "lzw31-sn", 16].includes(parameter)) {
          parameter = 16;
        } else if (["combo_light", "lzw36_light", 24].includes(parameter)) {
          parameter = 24;
        } else if (["combo_fan", "lzw36_fan", "fan", 25].includes(parameter)) {
          parameter = 25;
        } else if (
          ["lzw36", "fan and light", "light and fan", 49].includes(parameter)
        ) {
          parameter = 49;
        } else {
          err = `Incorrect Switch Type: ${parameter}`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
        return parameter;
      }

      function inputColorConvert(color) {
        var rgb;
        if (Array.isArray(color) && typeof color === "object") {
          if (color.length === 3) {
            if (color[0] > 255 || color[1] > 255 || color[2] > 255) {
              err = `RGB values exceed 255: ${color}`;
              if (done) {
                done(err);
              } else {
                node.error(err);
              }
            } else {
              rgb = color;
            }
          } else {
            err = `Invalid array format: ${color}`;
            if (done) {
              done(err);
            } else {
              node.error(err);
            }
          }
        } else if (typeof color === "string") {
          if (color.startsWith("#") === true) {
            rgb = convert.hex.rgb(color);
          } else {
            color = color.replace(" ", "").toLowerCase();
            rgb = convert.keyword.rgb(color);
          }
        } else if (typeof color === "number") {
          if (color >= 0 && color <= 361) {
            switch (color){
              case 361:
                rgb = [255,255,255];
                break;
              default:
                let conv_hsv = [color, 100, 100];
                rgb = convert.hsv.rgb(conv_hsv);
                break;
            }
          } else {
            err = `Incorrect Hue Value: ${color}`;
            if (done) {
              done(err);
            } else {
              node.error(err);
            }
          }
        }
        if (!rgb) {
          if (!err){
            err = `Incorrect Color: ${color}.`;
            node.error(err);
          }
        }
        return rgb;
      }

      function inputBrightnessCheck(brightness) {
        if (brightness < 0 || brightness > 11) {
          err = `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      }

      function inputDurationConvert(duration) {
        if (isNaN(duration)) {
          let value = parseInt(duration);
          let unit = duration.replace(/^[\s\d]+/, "").toLowerCase();
          if (
            ["second", "seconds"].includes(unit) &&
            value > 0 &&
            value <= 60
          ) {
            duration = value;
          } else if (
            ["minute", "minutes"].includes(unit) &&
            value > 0 &&
            value <= 60
          ) {
            duration = value + 60;
          } else if (
            ["hour", "hours"].includes(unit) &&
            value > 0 &&
            value <= 134
          ) {
            duration = value + 120;
          } else if (
            ["day", "days"].includes(unit) &&
            value > 0 &&
            value <= 5
          ) {
            duration = value * 24 + 120;
          } else if (["forever", "indefinite", "indefinitely"].includes(unit)) {
            duration = 255;
          } else if (["off", "disable"].includes(unit)) {
            duration = 0;
          } else {
            node.error(`Incorrect Duration Format: ${duration}`);
            error++;
          }
        } else if (duration < 0 || duration > 255) {
          err = `Incorrect Duration: ${duration}.`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
        return duration;
      }

      function inputEffectConvert(effect, parameter) {
        if (isNaN(effect)) {
          effect = effect.toLowerCase();
          const switchOptions = {
            off: 0,
            solid: 1,
            "fast blink": 2,
            "slow blink": 3,
            pulse: 4,
          };
          const dimmerOptions = {
            off: 0,
            solid: 1,
            chase: 2,
            "fast blink": 3,
            "slow blink": 4,
            pulse: 5,
          };
          if (parameter === 8 && switchOptions[effect] !== undefined) {
            effect = switchOptions[effect];
          } else if (
            [16, 24, 25, 49].includes(parameter) &&
            dimmerOptions[effect] !== undefined
          ) {
            effect = dimmerOptions[effect];
          } else {
            if (parameter === 8) {
              err = `Incorrect Effect: ${effect}. Valid effects for this switch type are Off, Solid, Fast Blink, Slow Blink, or Pulse`;
              if (done) {
                done(err);
              } else {
                node.error(err);
              }
            } else if ([16, 24, 25, 49].includes(parameter)) {
              err = `Incorrect Effect: ${effect}. Valid effects for this switch type are Off, Solid, Chase, Fast Blink, Slow Blink, or Pulse`;
              if (done) {
                done(err);
              } else {
                node.error(err);
              }
            } else {
              err = `Incorrect Effect: ${effect}, check switch type`;
              if (done) {
                done(err);
              } else {
                node.error(err);
              }
            }
          }
        } else if (![0, 1, 2, 3, 4, 5].includes(effect)) {
          err = `Incorrect Effect: ${effect}. Valid effect range is 0-5`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
        return effect;
      }

      function inputDomainCheck(domain) {
        switch (domain) {
          case "zwave_js":
            if (multicast) {
              service = "multicast_set_value";
            } else {
              service = "bulk_set_partial_config_parameters";
            }
            break;
          case "ozw":
            service = "set_config_parameter";
            break;
          case "zwave":
            service = "set_config_parameter";
            break;
          default:
            err = `Invalid Z-Wave domain: ${domain}. Supported domains are zwave, ozw, or zwave_js.`;
            if (done) {
              done(err);
            } else {
              node.error(err);
            }
        }
      }

      function calculateValue() {
        var value, hsl, keyword, hue;
        if (clear === true || effect === 0 || duration === 0) {
          switch (domain) {
            case "zwave_js":
              value = 65536;
              break;
            default:
              value = 0;
              break;
          }
          node.status(`Cleared notification!`);
        } else {
          if (color[0] == color[1] && color[1] == color[2]) {
            keyword = "white";
            hue = 255;
          } else {
            hsl = [convert.rgb.hsl(color)[0], 100, 50];
            keyword = convert.rgb.keyword(convert.hsl.rgb(hsl));
            hue = parseInt((hsl[0] * (17 / 24)).toFixed(0));
          }
          value = hue + (brightness * 256) + (duration * 65536) + (effect * 16777216);
          node.status(`Sent Color: ${keyword}`);
        }
        return value;
      }

      function sendNotification(parameter, value, id) {
        var size = domain === "zwave" ? { size: 4 } : {};
        switch (service) {
          case "multicast_set_value":
            node.send({
              payload: {
                domain,
                service,
                data: { ...id, property: parameter, command_class: 112, value },
              },
            });
            break;
          default:
            node.send({
              payload: {
                domain,
                service,
                data: { ...id, parameter, ...size, value },
              },
            });
            break;
        }
      }

      parameter = inputSwitchConvert(parameter);
      color = inputColorConvert(color);
      inputBrightnessCheck(brightness);
      duration = inputDurationConvert(duration);
      effect = inputEffectConvert(effect, parameter);
      inputDomainCheck(domain);

      if (!err) {
        var id;
        var value = calculateValue();
        switch (domain) {
          case "zwave_js":
            const entity_id = payload.entity_id || entityid;
            id = entity_id ? { entity_id } : {};
            switch (parameter) {
              case 49:
                sendNotification(24, value, id);
                sendNotification(25, value, id);
                break;
              default:
                sendNotification(parameter, value, id);
                break;
            }
            break;
          default:
            var node_id = payload.node_id || nodeid;
            const nodes = node_id.split(",").map(Number);
            for (let x in nodes) {
              node_id = nodes[x];
              id = node_id ? { node_id } : {};
              switch (parameter) {
                case 49:
                  sendNotification(24, value, id);
                  sendNotification(25, value, id);
                  break;
                default:
                  sendNotification(parameter, value, id);
                  break;
              }
            }
            break;
        }
      }
    });
  }
  RED.nodes.registerType(
    "inovelli-notification-manager",
    InovelliNotificationManager
  );
};
