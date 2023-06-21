module.exports = function (RED) {
  const convert = require("color-convert");
  function InovelliLEDManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const {
      zwave,
      nodeid,
      entityid,
      deviceid,
      switchtype,
      color,
      brightness,
      brightnessOff,
      fanColor,
      fanBrightness,
      fanBrightnessOff,
      toggleColor,
      toggleBrightness,
      toggleBrightnessOff,
      toggleFanColor,
      toggleFanBrightness,
      toggleFanBrightnessOff,
      useincomingeventdata,
      multicast,
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.deviceid = deviceid;
    this.nodeid = nodeid;
    this.switchtype = parseInt(switchtype, 10);
    this.color = parseInt(color, 10);
    this.brightness = parseInt(brightness, 10);
    this.brightnessOff = parseInt(brightnessOff, 10);
    this.fanColor = parseInt(fanColor, 10);
    this.fanBrightness = parseInt(fanBrightness, 10);
    this.fanBrightnessOff = parseInt(fanBrightnessOff, 10);
    this.toggleColor = toggleColor;
    this.toggleBrightness = toggleBrightness;
    this.toggleBrightnessOff = toggleBrightnessOff;
    this.toggleFanColor = toggleFanColor;
    this.toggleFanBrightness = toggleFanBrightness;
    this.toggleFanBrightnessOff = toggleFanBrightnessOff;
    this.useincomingeventdata = useincomingeventdata;
    this.multicast = multicast;

    node.on("input", (msg, send, done) => {
      const {
        zwave: presetZwave,
        entityid,
        deviceid,
        nodeid,
        switchtype: presetSwitchtype,
        color: presetColor,
        brightness: presetBrightness,
        brightnessOff: presetBrightnessOff,
        fanColor: presetFanColor,
        fanBrightness: presetFanBrightness,
        fanBrightnessOff: presetFanBrightnessOff,
        toggleColor,
        toggleBrightness,
        toggleBrightnessOff,
        toggleFanColor,
        toggleFanBrightness,
        toggleFanBrightnessOff,
        useincomingeventdata: presetUseincomingeventdata,
        multicast: presetMulticast,
      } = node;

      const payload = msg.payload || {};
      const domain = payload.zwave || presetZwave;
      var parameter = payload.switchtype || presetSwitchtype;
      var err,
        id,
        color,
        brightness,
        brightnessOff,
        fanColor,
        fanBrightness,
        fanBrightnessOff;
      const useincomingeventdata = payload.useincomingeventdata != undefined ? payload.useincomingeventdata : presetUseincomingeventdata;
      const multicast =
        payload.multicast != undefined ? payload.multicast : presetMulticast;
      const output = {};

      function inputDomainCheck(domain) {
        let node_id;
        switch (domain) {
          case "zwave_js":
            var entity_id;
            var device_id;

            if (useincomingeventdata) {
              device_id = payload.event.device_id || deviceid;
            }
            else {
              entity_id = payload.entity_id || entityid;
              device_id = payload.device_id || deviceid;
            }

            id = entity_id ? { entity_id } : {};
            // This makes the device_id, if specified, take priority over the entity_id
            id = device_id ? { device_id } : id;

            output.domain = "zwave_js";
            if (multicast) {
              output.service = "multicast_set_value";
            } else {
              output.service = "set_config_parameter";
            }
            break;
          case "ozw":
            node_id = payload.node_id || nodeid;
            id = node_id.split(",").map(Number);
            output.service = "set_config_parameter";
            break;
          case "zwave":
            node_id = payload.node_id || nodeid;
            id = node_id.split(",").map(Number);
            output.service = "set_config_parameter";
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

      function inputSwitchConvert(parameter) {
        if (isNaN(parameter)) {
          parameter = parameter.toLowerCase();
        }
        if (["switch", "lzw30", "lzw30-sn", 5].includes(parameter)) {
          output.colorParam = 5;
          output.brightnessParam = 6;
          output.brightnessOffParam = 7;
          LightHandler();
        } else if (["dimmer", "lzw31", "lzw31-sn", 13].includes(parameter)) {
          output.colorParam = 13;
          output.brightnessParam = 14;
          output.brightnessOffParam = 15;
          LightHandler();
        } else if (["combo_light", "lzw36_light", 18].includes(parameter)) {
          output.colorParam = 18;
          output.brightnessParam = 19;
          output.brightnessOffParam = 22;
          LightHandler();
        } else if (["combo_fan", "lzw36_fan", "fan", 20].includes(parameter)) {
          output.fanColorParam = 20;
          output.fanBrightnessParam = 21;
          output.fanBrightnessOffParam = 23;
          FanHandler();
        } else if (
          ["lzw36", "fan and light", "light and fan", 38].includes(parameter)
        ) {
          output.colorParam = 18;
          output.brightnessParam = 19;
          output.brightnessOffParam = 22;
          output.fanColorParam = 20;
          output.fanBrightnessParam = 21;
          output.fanBrightnessOffParam = 23;
          LightHandler();
          FanHandler();
        } else {
          err = `Incorrect Switch Type: ${parameter}`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      }

      function inputColorConvert(color, source) {
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
            err = `Invalid array format for ${source}: ${color}`;
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
            switch (color) {
              case 361:
                rgb = [255, 255, 255];
                break;
              default:
                let conv_hsv = [color, 100, 100];
                rgb = convert.hsv.rgb(conv_hsv);
                break;
            }
          }
        }
        if (rgb) {
          return rgb;
        } else {
          err = `Incorrect Color for ${source}: ${color}.`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      }

      function inputBrightnessCheck(brightness, source) {
        if (brightness < 0 || brightness > 11) {
          err = `Invalid brightness value for brightness while ${source}: ${brightness}. Please enter a value between 0 and 10.`;
          if (done) {
            done(err);
          } else {
            node.error(err);
          }
        }
      }

      inputDomainCheck(domain);
      inputSwitchConvert(parameter);

      function LightHandler() {
        if (!err) {
          if (toggleColor || payload.color) {
            let hsl, keyword, hue;
            color = payload.color || presetColor;
            color = inputColorConvert(color, "Light");
            if (color[0] == color[1] && color[1] == color[2]) {
              keyword = "white";
              hue = 255;
            } else {
              hsl = [convert.rgb.hsl(color)[0], 100, 50];
              keyword = convert.rgb.keyword(convert.hsl.rgb(hsl));
              hue = parseInt((hsl[0] * (17 / 24)).toFixed(0));
            }
            node.status(`Light Color: ${keyword}`);
            constructMsg("color", hue, output.colorParam);
          }
          if (toggleBrightness || payload.brightness) {
            brightness = payload.brightness || presetBrightness;
            inputBrightnessCheck(brightness, "on");
            constructMsg("brightness", brightness, output.brightnessParam);
          }
          if (toggleBrightnessOff || payload.brightnessOff) {
            brightnessOff = payload.brightnessOff || presetBrightnessOff;
            inputBrightnessCheck(brightnessOff, "off");
            constructMsg(
              "brightnessOff",
              brightnessOff,
              output.brightnessOffParam
            );
          }
        }
      }

      function FanHandler() {
        if (!err) {
          if (toggleFanColor || payload.fanColor) {
            let hsl, keyword, hue;
            color = payload.fanColor || presetFanColor;
            color = inputColorConvert(color, "Fan");
            if (color[0] == color[1] && color[1] == color[2]) {
              keyword = "white";
              hue = 255;
            } else {
              hsl = [convert.rgb.hsl(color)[0], 100, 50];
              keyword = convert.rgb.keyword(convert.hsl.rgb(hsl));
              hue = parseInt((hsl[0] * (17 / 24)).toFixed(0));
            }
            node.status(`Fan Color: ${keyword}`);
            constructMsg("fanColor", hue, output.fanColorParam);
          }
          if (toggleFanBrightness || payload.fanBrightness) {
            fanBrightness = payload.fanBrightness || presetFanBrightness;
            inputBrightnessCheck(fanBrightness, "on");
            constructMsg(
              "fanBrightness",
              fanBrightness,
              output.fanBrightnessParam
            );
          }
          if (toggleFanBrightnessOff || payload.fanBrightnessOff) {
            fanBrightnessOff =
              payload.fanBrightnessOff || presetFanBrightnessOff;
            inputBrightnessCheck(fanBrightnessOff, "off");
            constructMsg(
              "fanBrightnessOff",
              fanBrightnessOff,
              output.fanBrightnessOffParam
            );
          }
        }
      }

      function constructMsg(type, value, param) {
        var data = {};
        switch (output.service) {
          case "multicast_set_value":
            data = {
              ...id,
              property: param,
              command_class: 112,
              value,
            };
            sendMsg(data);
            break;
          default:
            switch (domain) {
              case "zwave_js":
                data = { ...id, parameter: param, value };
                sendMsg(data);
                break;
              case "ozw":
                for (let x in id) {
                  let node_id = id[x];
                  node_id = node_id ? { node_id } : {};
                  data = { ...node_id, parameter: param, value };
                  sendMsg(data);
                }
                break;
              case "zwave":
                let size;
                switch (type) {
                  case "color":
                    size = 2;
                    break;
                  case "fanColor":
                    size = 2;
                    break;
                  default:
                    size = 1;
                    break;
                }
                for (let x in id) {
                  let node_id = id[x];
                  node_id = node_id ? { node_id } : {};
                  data = { ...node_id, parameter: param, size, value };
                  sendMsg(data);
                }
                break;
            }
        }
      }
      function sendMsg(data) {
        node.send({
          payload: {
            domain,
            service: output.service,
            data,
          },
        });
      }
    });
  }
  RED.nodes.registerType("inovelli-led-manager", InovelliLEDManager);
};
