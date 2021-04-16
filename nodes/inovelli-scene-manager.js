module.exports = function (RED) {
  function InovelliSceneManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const { zwave, nodeid, switchtype } = config;
    this.zwave = zwave;
    this.nodeid = parseInt(nodeid, 10);
    this.switchtype = switchtype;

    node.on("input", (msg) => {
      const { zwave: presetZwave, nodeid, switchtype } = node;
      const { payload } = msg;
      const node_id = payload.event.node_id;
      const event_type = payload.event_type;

      if (
        (nodeid === node_id && event_type === "zwave_js_value_notification") ||
        event_type === "scene_activated"
      ) {
        //const scenes = require("./nodes/common/scenes.js");
        const domain = payload.event.domain;
        var error = 0;
        var output;

        const LZW30Map = {
          0: {
            button: 2,
            scene: 1,
          },
          1: {
            button: 2,
            scene: 4,
          },
          2: {
            button: 2,
            scene: 5,
          },
          3: {
            button: 2,
            scene: 6,
          },
          4: {
            button: 2,
            scene: 7,
          },
          5: {
            button: 2,
            scene: 2,
          },
          6: {
            button: 2,
            scene: 3,
          },
          7: {
            button: 1,
            scene: 1,
          },
          8: {
            button: 1,
            scene: 4,
          },
          9: {
            button: 1,
            scene: 5,
          },
          10: {
            button: 1,
            scene: 6,
          },
          11: {
            button: 1,
            scene: 7,
          },
          12: {
            button: 1,
            scene: 2,
          },
          13: {
            button: 1,
            scene: 3,
          },
          14: {
            button: 3,
            scene: 1,
          },
        };
        const LZW31Map = {
          0: {
            button: 2,
            scene: 1,
          },
          1: {
            button: 2,
            scene: 4,
          },
          2: {
            button: 2,
            scene: 5,
          },
          3: {
            button: 2,
            scene: 6,
          },
          4: {
            button: 2,
            scene: 7,
          },
          5: {
            button: 2,
            scene: 2,
          },
          6: {
            button: 2,
            scene: 3,
          },
          7: {
            button: 1,
            scene: 1,
          },
          8: {
            button: 1,
            scene: 4,
          },
          9: {
            button: 1,
            scene: 5,
          },
          10: {
            button: 1,
            scene: 6,
          },
          11: {
            button: 1,
            scene: 7,
          },
          12: {
            button: 1,
            scene: 2,
          },
          13: {
            button: 1,
            scene: 3,
          },
          14: {
            button: 3,
            scene: 1,
          },
        };
        const LZW36Map = {
          0: {
            button: 2,
            scene: 0,
          },
          1: {
            button: 2,
            scene: 3,
          },
          2: {
            button: 2,
            scene: 4,
          },
          3: {
            button: 2,
            scene: 5,
          },
          4: {
            button: 2,
            scene: 6,
          },
          5: {
            button: 2,
            scene: 2,
          },
          6: {
            button: 2,
            scene: 1,
          },
          7: {
            button: 3,
            scene: 0,
          },
          8: {
            button: 4,
            scene: 0,
          },
          9: {
            button: 1,
            scene: 0,
          },
          10: {
            button: 1,
            scene: 3,
          },
          11: {
            button: 1,
            scene: 4,
          },
          12: {
            button: 1,
            scene: 5,
          },
          13: {
            button: 1,
            scene: 6,
          },
          14: {
            button: 1,
            scene: 2,
          },
          15: {
            button: 1,
            scene: 1,
          },
          16: {
            button: 5,
            scene: 0,
          },
          17: {
            button: 6,
            scene: 0,
          },
        };
        const LZW45Map = {
          0: {
            button: 2,
            scene: 1,
          },
          1: {
            button: 2,
            scene: 4,
          },
          2: {
            button: 2,
            scene: 5,
          },
          3: {
            button: 2,
            scene: 6,
          },
          4: {
            button: 2,
            scene: 7,
          },
          5: {
            button: 2,
            scene: 2,
          },
          6: {
            button: 2,
            scene: 3,
          },
          7: {
            button: 1,
            scene: 1,
          },
          8: {
            button: 1,
            scene: 4,
          },
          9: {
            button: 1,
            scene: 5,
          },
          10: {
            button: 1,
            scene: 6,
          },
          11: {
            button: 1,
            scene: 7,
          },
          12: {
            button: 1,
            scene: 2,
          },
          13: {
            button: 1,
            scene: 3,
          },
          14: {
            button: 3,
            scene: 1,
          },
        };

        function validateDomain(preset, incoming) {
          if (preset !== incoming) {
            node.error(
              `Incorrect Z-Wave Integration. Node is set for ${preset} but recieved an event for ${incoming}`
            );
            error++;
          }
        }

        function routeOutputs(button, scene) {
          switch (switchtype) {
            case "LZW30":
              const LZW30 = [
                "Tap Up on Light Paddle 1x",
                "Tap Up on Light Paddle 2x",
                "Tap Up on Light Paddle 3x",
                "Tap Up on Light Paddle 4x",
                "Tap Up on Light Paddle 5x",
                "Hold Up on Light Paddle",
                "Release Up on Light Paddle",
                "Tap Down on Light Paddle 1x",
                "Tap Down on Light Paddle 2x",
                "Tap Down on Light Paddle 3x",
                "Tap Down on Light Paddle 4x",
                "Tap Down on Light Paddle 5x",
                "Hold Down on Light Paddle",
                "Release Down on Light Paddle",
                "Tap Config Button 1x",
              ];
              output = new Array(LZW30.length);
              for (var i = 0; i < LZW30.length; i++) {
                if (
                  button === LZW30Map[i].button &&
                  scene === LZW30Map[i].scene
                ) {
                  output[i] = msg;
                }
              }
              break;
            case "LZW31":
              const LZW31 = [
                "Tap Up on Light Paddle 1x",
                "Tap Up on Light Paddle 2x",
                "Tap Up on Light Paddle 3x",
                "Tap Up on Light Paddle 4x",
                "Tap Up on Light Paddle 5x",
                "Hold Up on Light Paddle",
                "Release Up on Light Paddle",
                "Tap Down on Light Paddle 1x",
                "Tap Down on Light Paddle 2x",
                "Tap Down on Light Paddle 3x",
                "Tap Down on Light Paddle 4x",
                "Tap Down on Light Paddle 5x",
                "Hold Down on Light Paddle",
                "Release Down on Light Paddle",
                "Tap Config Button 1x",
              ];
              output = new Array(LZW31.length);
              for (var i = 0; i < LZW31.length; i++) {
                if (
                  button === LZW31Map[i].button &&
                  scene === LZW31Map[i].scene
                ) {
                  output[i] = msg;
                }
              }
              break;
            case "LZW36":
              const LZW36 = [
                "Tap on Light Button 1x",
                "Tap on Light Button 2x",
                "Tap on Light Button 3x",
                "Tap on Light Button 4x",
                "Tap on Light Button 5x",
                "Hold on Light Button (3 Seconds)",
                "Release on Light (After Hold) Button",
                "Tap on Light Rocker Up",
                "Tap on Light Rocker Down",
                "Tap on Fan Button 1x",
                "Tap on Fan Button 2x",
                "Tap on Fan Button 3x",
                "Tap on Fan Button 4x",
                "Tap on Fan Button 5x",
                "Hold on Fan Button (3 Seconds)",
                "Release on Fan (After Hold) Button",
                "Tap on Fan Rocker Up",
                "Tap on Fan Rocker Down",
              ];
              output = new Array(LZW36.length);
              for (var i = 0; i < LZW36.length; i++) {
                if (
                  button === LZW36Map[i].button &&
                  scene === LZW36Map[i].scene
                ) {
                  output[i] = msg;
                }
              }
              break;
            case "LZW45":
              const LZW45 = [
                "Tap Up on Light Paddle 1x",
                "Tap Up on Light Paddle 2x",
                "Tap Up on Light Paddle 3x",
                "Tap Up on Light Paddle 4x",
                "Tap Up on Light Paddle 5x",
                "Hold Up on Light Paddle",
                "Release Up on Light Paddle",
                "Tap Down on Light Paddle 1x",
                "Tap Down on Light Paddle 2x",
                "Tap Down on Light Paddle 3x",
                "Tap Down on Light Paddle 4x",
                "Tap Down on Light Paddle 5x",
                "Hold Down on Light Paddle",
                "Release Down on Light Paddle",
                "Tap Config Button 1x",
              ];
              output = new Array(LZW45.length);
              for (var i = 0; i < LZW45.length; i++) {
                if (
                  button === LZW45Map[i].button &&
                  scene === LZW45Map[i].scene
                ) {
                  output[i] = msg;
                }
              }
              break;
          }
          node.send(output);
        }

        validateDomain(presetZwave, domain);

        if (error === 0) {
          let button, scene;
          switch (domain) {
            case "zwave_js":
              button = parseInt(payload.event.property_key);
              scene = parseInt(payload.event.value_raw);
              break;
            case "ozw":
              button = parseInt(payload.event.scene_id);
              scene = parseInt(payload.event.scene_value_id);
          }
          routeOutputs(button, scene);
        }
      }
    });
  }
  RED.nodes.registerType("inovelli-scene-manager", InovelliSceneManager);
};
