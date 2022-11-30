require('color-convert');

// domainCheck = (domain) => {
//   let node_id;
//   switch (domain) {
//     case "zwave_js":
//       var entity_id = payload.entity_id || entityid;
//       id = entity_id ? { entity_id } : {};
//       output.domain = "zwave_js";
//       if (multicast) {
//         output.service = "multicast_set_value";
//       } else {
//         output.service = "set_config_parameter";
//       }
//       break;
//     case "ozw":
//       node_id = payload.node_id || nodeid;
//       id = node_id.split(",").map(Number);
//       output.service = "set_config_parameter";
//       break;
//     case "zwave":
//       node_id = payload.node_id || nodeid;
//       id = node_id.split(",").map(Number);
//       output.service = "set_config_parameter";
//       break;
//     default:
//       err = `Invalid Z-Wave domain: ${domain}. Supported domains are zwave, ozw, or zwave_js.`;
//       if (done) {
//         done(err);
//       } else {
//         node.error(err);
//       }
//   }
// };

colorConvert = (color) => {
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
      rgb = hex.rgb(color);
    } else {
      color = color.replace(" ", "").toLowerCase();
      rgb = keyword.rgb(color);
    }
  } else if (typeof color === "number") {
    if (color >= 0 && color <= 361) {
      switch (color) {
        case 361:
          rgb = [255, 255, 255];
          break;
        default:
          let conv_hsv = [color, 100, 100];
          rgb = hsv.rgb(conv_hsv);
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
    if (!err) {
      err = `Incorrect Color: ${color}.`;
      node.error(err);
    }
  }
  return rgb;
};

colorConvertSource = (color, source) => {
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
      rgb = hex.rgb(color);
    } else {
      color = color.replace(" ", "").toLowerCase();
      rgb = keyword.rgb(color);
    }
  } else if (typeof color === "number") {
    if (color >= 0 && color <= 361) {
      switch (color) {
        case 361:
          rgb = [255, 255, 255];
          break;
        default:
          let conv_hsv = [color, 100, 100];
          rgb = hsv.rgb(conv_hsv);
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
};

switchConvert = (parameter) => {
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
};

brightnessCheck = (brightness) => {
  if (brightness < 0 || brightness > 11) {
    err = `Invalid brightness value: ${brightness}. Please enter a value between 0 and 10`;
    if (done) {
      done(err);
    } else {
      node.error(err);
    }
  }
};

durationConvert = (duration) => {
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
};

effectConvert = (effect, parameter) => {
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
};

const ButtonMap = {
  "LZW30": {
      // Up Button
      2: {
          0: 0,
          3: 1,
          4: 2,
          5: 3,
          6: 4,
          2: 5,
          1: 6,
      },
      // Down Button
      1: {
          0: 7,
          3: 8,
          4: 9,
          5: 10,
          6: 11,
          2: 12,
          1: 13,
      },
      // Config Button
      3: {
          0: 14,
      },
  },
  "LZW31": {
      // Up Button
      2: {
          0: 0,
          3: 1,
          4: 2,
          5: 3,
          6: 4,
          2: 5,
          1: 6,
      },
      // Down Button
      1: {
          0: 7,
          3: 8,
          4: 9,
          5: 10,
          6: 11,
          2: 12,
          1: 13,
      },
      // Config Button
      3: {
          0: 14,
      },
  },
  "LZW36": {
      // Light Button
      2: {
          0: 0,
          3: 1,
          4: 2,
          5: 3,
          6: 4,
          2: 5,
          1: 6,
      },
      // Light Rocker Up
      3: {
          0: 7,
      },
      // Light Rocker Down
      4: {
          0: 8,
      },
      1: {
          0: 9,
          3: 10,
          4: 11,
          5: 12,
          6: 13,
          2: 14,
          1: 15,
      },
      // Fan Rocker Up
      5: {
          0: 16,
      },
      // Fan Rocker Down
      6: {
          0: 17,
      },
  },
  "LZW45": {
      // Up Button
      2: {
          1: 0,
          4: 1,
          5: 2,
          6: 3,
          7: 4,
          2: 5,
          3: 6,
      },
      // Down Button
      1: {
          1: 7,
          4: 8,
          5: 9,
          6: 10,
          7: 11,
          2: 12,
          3: 13,
      },
      // Config Button
      3: {
          1: 14,
      },
  },
  "LZM31": {
      // Up Button
      2: {
          0: 0,
          3: 1,
          4: 2,
          5: 3,
          6: 4,
          2: 5,
          1: 6,
      },
      // Down Button
      1: {
          0: 7,
          3: 8,
          4: 9,
          5: 10,
          6: 11,
          2: 12,
          1: 13,
      },
      // Config Button
      3: {
          0: 14,
          3: 15,
      },
  },
};

const OutputLabels = {
  "LZW30": [
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
  ],
  "LZW31": [
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
  ],
  "LZW36": [
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
  ],
  "LZW45": [
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
  ],
  "VZM31": [
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
      "Tap Config Button 2x",
  ],
};

module.exports = {
  // domainCheck,
  colorConvert,
  colorConvertSource,
  switchConvert,
  brightnessCheck,
  durationConvert,
  effectConvert,
  ButtonMap,
  OutputLabels,
}