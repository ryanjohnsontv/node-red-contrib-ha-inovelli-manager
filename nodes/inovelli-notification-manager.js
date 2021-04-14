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
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.nodeid = parseInt(nodeid, 10);
    this.color = parseInt(color, 10);
    this.brightness = parseInt(brightness, 10);
    this.duration = parseInt(duration, 10);
    this.effect = parseInt(effect, 10);
    this.switchtype = parseInt(switchtype, 10);
    this.clear = clear;

    node.on("input", (msg) => {
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
      } = node;
      //const { payload } = msg.payload ? msg : {};
      var { payload } = msg;
      if (payload === undefined) {
        payload = {};
      }
      const domain = payload.zwave || presetZwave;
      const brightness = payload.brightness || presetBrightness;
      var color = payload.color || presetColor;
      var duration = payload.duration || presetDuration;
      var effect = payload.effect || presetEffect;
      var parameter = payload.switchtype || presetSwitchtype;
      var clear;
      if (payload.clear === undefined) {
        clear = presetClear;
      } else {
        clear = payload.clear;
      }
      var error = 0;

      function inputSwitchConvert(parameter) {
        if (isNaN(parameter)) {
          parameter = parameter.toLowerCase();
          var switchConvert;
          if (["switch", "lzw30", "lzw30-sn", "on/off"].includes(parameter)) {
            switchConvert = 8;
          } else if (["dimmer", "lzw31", "lzw31-sn"].includes(parameter)) {
            switchConvert = 16;
          } else if (["combo_light", "lzw36_light"].includes(parameter)) {
            switchConvert = 24;
          } else if (["combo_fan", "lzw36_fan", "fan"].includes(parameter)) {
            switchConvert = 25;
          } else if (
            ["lzw36", "fan and light", "light and fan"].includes(parameter)
          ) {
            switchConvert = 49;
          }
          if (switchConvert !== undefined) {
            parameter = switchConvert;
          } else {
            node.error(`Incorrect Switch Type: ${parameter}`);
            error++;
          }
        } else if (![8, 16, 24, 25, 49].includes(parameter)) {
          node.error(
            `Incorrect Switch Value: ${parameter}. Valid values are 8, 16, 24, 25, or 49.`
          );
          error++;
        }
        return parameter;
      }

      function inputColorConvert(color) {
        if (Array.isArray(color) && typeof color === "object") {
          if (color.length === 3) {
            rgb = color;
          } else {
            node.error(`Check your RGB values: ${color}`);
            error++;
          }
        } else if (typeof color === "string") {
          if (color.startsWith("#") === true) {
            rgb = convert.hex.rgb(color);
          } else {
            color = color.replace(" ", "").toLowerCase();
            rgb = convert.keyword.rgb(color);
          }
        } else if (typeof color === "number") {
          if (color >= 0 && color <= 360) {
            let conv_hsv = [color, 100, 100];
            rgb = convert.hsv.rgb(conv_hsv);
          } else {
            node.error(`Incorrect Hue Value: ${color}`);
            error++;
          }
        } else {
          node.error(`Incorrect Color: ${color}. Using default color: Red`);
        }
        if (rgb === undefined) {
          node.error(
            `Incorrect Color: ${color}. Using preset color value: ${presetColor}`
          );
          let conv_hsv = [presetColor, 100, 100];
          rgb = convert.hsv.rgb(conv_hsv);
        }
        return rgb;
      }

      function inputBrightnessCheck(brightness) {
        if (brightness < 0 || brightness > 11) {
          node.error(
            `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10.`
          );
          error++;
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
          node.error(`Incorrect Duration: ${duration}. `);
          error++;
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
              node.error(
                `Incorrect Effect: ${effect}. Valid effects for this switch type are Off, Solid, Fast Blink, Slow Blink, or Pulse`
              );
            } else if ([16, 24, 25, 49].includes(parameter)) {
              node.error(
                `Incorrect Effect: ${effect}. Valid effects for this switch type are Off, Solid, Chase, Fast Blink, Slow Blink, or Pulse`
              );
            } else {
              node.error(`Incorrect Effect: ${effect}, check switch type.`);
            }
            error++;
          }
        } else if (![0, 1, 2, 3, 4, 5].includes(effect)) {
          node.error(`Incorrect Effect: ${effect}. Valid effect range is 0-5.`);
          error++;
        }
        return effect;
      }

      parameter = inputSwitchConvert(parameter);
      color = inputColorConvert(color);
      inputBrightnessCheck(brightness);
      duration = inputDurationConvert(duration);
      effect = inputEffectConvert(effect, parameter);

      function sendNotification(domain, service, id, parameter, value) {
        var size = domain === "zwave" ? { size: 4 } : {};
        if (parameter === 49) {
          for (parameter = 24; parameter < 26; parameter++) {
            node.send({
              payload: {
                domain,
                service,
                data: { ...id, parameter, ...size, value },
              },
            });
          }
        } else {
          node.send({
            payload: {
              domain,
              service,
              data: { ...id, parameter, ...size, value },
            },
          });
        }
      }

      if (error === 0) {
        const hsl = [convert.rgb.hsl(color)[0], 100, 50];
        const keyword = convert.rgb.keyword(convert.hsl.rgb(hsl));
        const hue = parseInt((hsl[0] * (17 / 24)).toFixed(0));
        var value =
          hue + brightness * 256 + duration * 65536 + effect * 16777216;
        var service, id;
        if (domain === "zwave_js") {
          const entity_id = payload.entity_id || entityid;
          id = entity_id ? { entity_id } : {};
          service = "bulk_set_partial_config_parameters";
          if (clear === true || effect === 0 || duration === 0) {
            value = 65536;
            node.status(`Cleared notification!`);
          } else {
            node.status(`Sent Color: ${keyword}`);
          }
          sendNotification(domain, service, id, parameter, value);
        } else if (["ozw", "zwave"].includes(domain)) {
          const node_id = payload.node_id || nodeid;
          id = node_id ? { node_id } : {};
          service = "set_config_parameter";
          if (clear === true || effect === 0 || duration === 0) {
            value = 0;
            node.status(`Cleared notification!`);
          } else {
            node.status(`Sent Color: ${keyword}`);
          }
          sendNotification(domain, service, id, parameter, value);
        } else {
          node.error(
            `Invalid Z-Wave Domain: ${domain}. Accepted values are zwave_js, ozw, or zwave`
          );
        }
      } else {
        node.status(`Error! Check debug window for more info`);
      }
    });
  }
  RED.nodes.registerType(
    "inovelli-notification-manager",
    InovelliNotificationManager
  );
};
