import { Protocol } from "./protocol";
import {
  BLUE_LED_SWITCH_TYPES,
  BlueNotificationSwitchDef,
  resolveBlueNotificationSwitch,
  BLUE_SCENE_BUTTON_MAPS,
  BlueSceneSwitchType,
} from "./blue-switches";
import { resolveWhiteSceneSwitch } from "./white-switches";
export type LedPropertyKey =
  "color" | "colorOff" | "brightness" | "brightnessOff" | "fanColor" | "fanBrightness" | "fanBrightnessOff";
export interface LedSwitchDef {
  aliases: (string | number)[];
  protocol: Protocol;
  params: Partial<Record<LedPropertyKey, number | string>>;
}
export const LED_SWITCH_TYPES: LedSwitchDef[] = [
  {
    aliases: ["switch", "lzw30", "lzw30-sn", 5],
    protocol: "zwave",
    params: { color: 5, brightness: 6, brightnessOff: 7 },
  },
  {
    aliases: ["dimmer", "lzw31", "lzw31-sn", 13],
    protocol: "zwave",
    params: { color: 13, brightness: 14, brightnessOff: 15 },
  },
  {
    aliases: ["combo_light", "lzw36_light", 18],
    protocol: "zwave",
    params: { color: 18, brightness: 19, brightnessOff: 22 },
  },
  {
    aliases: ["combo_fan", "lzw36_fan", "fan", 20],
    protocol: "zwave",
    params: { fanColor: 20, fanBrightness: 21, fanBrightnessOff: 23 },
  },
  {
    aliases: ["lzw36", "fan and light", "light and fan", 38],
    protocol: "zwave",
    params: {
      color: 18,
      brightness: 19,
      brightnessOff: 22,
      fanColor: 20,
      fanBrightness: 21,
      fanBrightnessOff: 23,
    },
  },
  ...BLUE_LED_SWITCH_TYPES,
];
function normalizeAliasKey(input: string | number): string | number {
  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed !== "" && !isNaN(Number(trimmed)) ? Number(trimmed) : trimmed.toLowerCase();
  }
  return input;
}
export function resolveLedSwitch(input: string | number): LedSwitchDef {
  const key = normalizeAliasKey(input);
  const found = LED_SWITCH_TYPES.find((def) => def.aliases.includes(key));
  if (!found) {
    throw new Error(`Incorrect Switch Type: ${input}`);
  }
  return found;
}
export const SWITCH_EFFECTS: Record<string, number> = {
  off: 0,
  solid: 1,
  "fast blink": 2,
  "slow blink": 3,
  pulse: 4,
};
export const DIMMER_EFFECTS: Record<string, number> = {
  off: 0,
  solid: 1,
  chase: 2,
  "fast blink": 3,
  "slow blink": 4,
  pulse: 5,
};
export const LZW45_EFFECTS: Record<string, number> = {
  off: 0,
  solid: 1,
  chase: 2,
  "fast blink": 3,
  "slow blink": 4,
  "fast fade": 5,
  "slow fade": 6,
};
export const PIXEL_EFFECTS: Record<string, number> = {
  static: 1,
  blink: 2,
  breath: 3,
  "color wipe": 4,
  "color wipe reverse inverse": 5,
  "color wipe random": 6,
  "random color": 7,
  "single dynamic": 8,
  "multi dynamic": 9,
  rainbow: 10,
  "rainbow cycle": 11,
  scan: 12,
  "dual scan": 13,
  fade: 14,
  "running lights": 15,
  twinkle: 16,
  "twinkle random": 17,
  "twinkle fade": 18,
  "twinkle fade random": 19,
  sparkle: 20,
  "flash sparkle": 21,
  "hyper sparkle": 22,
  strobe: 23,
  "blink rainbow": 24,
  "chase white": 25,
  "chase color": 26,
  "chase random": 27,
  "chase rainbow": 28,
  "chase flash": 29,
  "chase flash random": 30,
  "chase rainbow white": 31,
  "chase blackout": 32,
  "chase blackout rainbow": 33,
  "color sweep random": 34,
  "running color": 35,
  "running red blue": 36,
  "running random": 37,
  "larson scanner": 38,
  comet: 39,
  fireworks: 40,
  "fireworks random": 41,
  "merry christmas": 42,
  "circus combustus": 43,
  halloween: 44,
  aurora: 45,
};
export interface NotificationSwitchDef {
  aliases: (string | number)[];
  protocol: "zwave";
  param: number;
  isCombo?: boolean;
  effects: Record<string, number>;
  format?: "bitpacked" | "pixelEffect";
}
export const NOTIFICATION_SWITCH_TYPES: NotificationSwitchDef[] = [
  {
    aliases: ["switch", "lzw30", "lzw30-sn", "on/off", 8],
    protocol: "zwave",
    param: 8,
    effects: SWITCH_EFFECTS,
  },
  { aliases: ["dimmer", "lzw31", "lzw31-sn", 16], protocol: "zwave", param: 16, effects: DIMMER_EFFECTS },
  { aliases: ["combo_light", "lzw36_light", 24], protocol: "zwave", param: 24, effects: DIMMER_EFFECTS },
  { aliases: ["combo_fan", "lzw36_fan", "fan", 25], protocol: "zwave", param: 25, effects: DIMMER_EFFECTS },
  {
    aliases: ["lzw36", "fan and light", "light and fan", 49],
    protocol: "zwave",
    param: 49,
    isCombo: true,
    effects: DIMMER_EFFECTS,
  },
  {
    aliases: ["lzw45", "light strip", "lightstrip", 21],
    protocol: "zwave",
    param: 21,
    effects: LZW45_EFFECTS,
  },
  {
    aliases: ["lzw45_pixel", "pixel effect", "pixeleffect", 31],
    protocol: "zwave",
    param: 31,
    effects: PIXEL_EFFECTS,
    format: "pixelEffect",
  },
];
export function resolveNotificationSwitch(
  input: string | number
): NotificationSwitchDef | BlueNotificationSwitchDef {
  const key = normalizeAliasKey(input);
  const found = NOTIFICATION_SWITCH_TYPES.find((def) => def.aliases.includes(key));
  if (!found && typeof key === "string") {
    const blueFound = resolveBlueNotificationSwitch(key);
    if (blueFound) {
      return blueFound;
    }
  }
  if (!found) {
    throw new Error(`Incorrect Switch Type: ${input}`);
  }
  return found;
}
export interface SceneButton {
  button: number;
  scene: number;
}
export type SceneSwitchType = "LZW30" | "LZW31" | "LZW36" | "LZW45";
export const SCENE_BUTTON_MAPS: Record<SceneSwitchType, Record<number, SceneButton>> = {
  LZW30: {
    0: { button: 2, scene: 0 },
    1: { button: 2, scene: 3 },
    2: { button: 2, scene: 4 },
    3: { button: 2, scene: 5 },
    4: { button: 2, scene: 6 },
    5: { button: 2, scene: 2 },
    6: { button: 2, scene: 1 },
    7: { button: 1, scene: 0 },
    8: { button: 1, scene: 3 },
    9: { button: 1, scene: 4 },
    10: { button: 1, scene: 5 },
    11: { button: 1, scene: 6 },
    12: { button: 1, scene: 2 },
    13: { button: 1, scene: 1 },
    14: { button: 3, scene: 0 },
  },
  LZW31: {
    0: { button: 2, scene: 0 },
    1: { button: 2, scene: 3 },
    2: { button: 2, scene: 4 },
    3: { button: 2, scene: 5 },
    4: { button: 2, scene: 6 },
    5: { button: 2, scene: 2 },
    6: { button: 2, scene: 1 },
    7: { button: 1, scene: 0 },
    8: { button: 1, scene: 3 },
    9: { button: 1, scene: 4 },
    10: { button: 1, scene: 5 },
    11: { button: 1, scene: 6 },
    12: { button: 1, scene: 2 },
    13: { button: 1, scene: 1 },
    14: { button: 3, scene: 0 },
  },
  LZW36: {
    0: { button: 2, scene: 0 },
    1: { button: 2, scene: 3 },
    2: { button: 2, scene: 4 },
    3: { button: 2, scene: 5 },
    4: { button: 2, scene: 6 },
    5: { button: 2, scene: 2 },
    6: { button: 2, scene: 1 },
    7: { button: 3, scene: 0 },
    8: { button: 4, scene: 0 },
    9: { button: 1, scene: 0 },
    10: { button: 1, scene: 3 },
    11: { button: 1, scene: 4 },
    12: { button: 1, scene: 5 },
    13: { button: 1, scene: 6 },
    14: { button: 1, scene: 2 },
    15: { button: 1, scene: 1 },
    16: { button: 5, scene: 0 },
    17: { button: 6, scene: 0 },
  },
  LZW45: {
    0: { button: 2, scene: 1 },
    1: { button: 2, scene: 4 },
    2: { button: 2, scene: 5 },
    3: { button: 2, scene: 6 },
    4: { button: 2, scene: 7 },
    5: { button: 2, scene: 2 },
    6: { button: 2, scene: 3 },
    7: { button: 1, scene: 1 },
    8: { button: 1, scene: 4 },
    9: { button: 1, scene: 5 },
    10: { button: 1, scene: 6 },
    11: { button: 1, scene: 7 },
    12: { button: 1, scene: 2 },
    13: { button: 1, scene: 3 },
    14: { button: 3, scene: 1 },
  },
};
export type SceneSwitchDef =
  | { protocol: "zwave"; buttonMap: Record<number, SceneButton> }
  | { protocol: "zigbee"; actions: string[] }
  | { protocol: "matter" };
export function resolveSceneSwitch(switchtype: string): SceneSwitchDef {
  if (switchtype in SCENE_BUTTON_MAPS) {
    return { protocol: "zwave", buttonMap: SCENE_BUTTON_MAPS[switchtype as SceneSwitchType] };
  }
  if (switchtype in BLUE_SCENE_BUTTON_MAPS) {
    return { protocol: "zigbee", actions: BLUE_SCENE_BUTTON_MAPS[switchtype as BlueSceneSwitchType] };
  }
  if (resolveWhiteSceneSwitch(switchtype)) {
    return { protocol: "matter" };
  }
  throw new Error(`Incorrect Switch Type: ${switchtype}`);
}
