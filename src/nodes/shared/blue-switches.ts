import { LedPropertyKey, LedSwitchDef } from "./switches";
export const BLUE_LED_SWITCH_TYPES: LedSwitchDef[] = [
  {
    aliases: ["vzm30-sn", "vzm30"],
    protocol: "zigbee",
    params: {
      color: "ledColorWhenOn",
      colorOff: "ledColorWhenOff",
      brightness: "ledIntensityWhenOn",
      brightnessOff: "ledIntensityWhenOff",
    },
  },
  {
    aliases: ["vzm31-sn", "vzm31"],
    protocol: "zigbee",
    params: {
      color: "ledColorWhenOn",
      colorOff: "ledColorWhenOff",
      brightness: "ledIntensityWhenOn",
      brightnessOff: "ledIntensityWhenOff",
    },
  },
  {
    aliases: ["vzm32-sn", "vzm32"],
    protocol: "zigbee",
    params: {
      color: "ledColorWhenOn",
      colorOff: "ledColorWhenOff",
      brightness: "ledIntensityWhenOn",
      brightnessOff: "ledIntensityWhenOff",
    },
  },
  {
    aliases: ["vzm36", "blue canopy", "fan canopy module"],
    protocol: "zigbee",
    params: {
      color: "ledColorWhenOn_1",
      brightness: "ledIntensityWhenOn_1",
    },
  },
  {
    aliases: ["vzm35-sn", "vzm35"],
    protocol: "zigbee",
    params: {
      color: "ledColorWhenOn",
      colorOff: "ledColorWhenOff",
      brightness: "ledIntensityWhenOn",
      brightnessOff: "ledIntensityWhenOff",
    },
  },
];
export const BLUE_LED_PROPERTY_KEYS: LedPropertyKey[] = ["color", "colorOff", "brightness", "brightnessOff"];
export const BLUE_LED_SEGMENT_SWITCHTYPES = ["VZM30-SN", "VZM31-SN", "VZM32-SN", "VZM35-SN"];
export function blueLedSegmentProperty(property: LedPropertyKey, segment: number): string | undefined {
  if (segment <= 0) {
    return undefined;
  }
  const suffix: Partial<Record<LedPropertyKey, string>> = {
    color: "ColorWhenOn",
    colorOff: "ColorWhenOff",
    brightness: "IntensityWhenOn",
    brightnessOff: "IntensityWhenOff",
  };
  const propertySuffix = suffix[property];
  return propertySuffix ? `defaultLed${segment}${propertySuffix}` : undefined;
}
export const BLUE_GLOBAL_LED_EFFECTS: Record<string, string> = {
  off: "off",
  solid: "solid",
  "fast blink": "fast_blink",
  "slow blink": "slow_blink",
  pulse: "pulse",
  chase: "chase",
  "open close": "open_close",
  "small to big": "small_to_big",
  aurora: "aurora",
  "slow falling": "slow_falling",
  "medium falling": "medium_falling",
  "fast falling": "fast_falling",
  "slow rising": "slow_rising",
  "medium rising": "medium_rising",
  "fast rising": "fast_rising",
  "medium blink": "medium_blink",
  "slow chase": "slow_chase",
  "fast chase": "fast_chase",
  "fast siren": "fast_siren",
  "slow siren": "slow_siren",
};
export const BLUE_SEGMENT_LED_EFFECTS: Record<string, string> = {
  off: "off",
  solid: "solid",
  "fast blink": "fast_blink",
  "slow blink": "slow_blink",
  pulse: "pulse",
  chase: "chase",
  falling: "falling",
  rising: "rising",
  aurora: "aurora",
};
export const BLUE_CLEAR_EFFECT = "clear_effect";
export interface BlueNotificationSwitchDef {
  aliases: string[];
  protocol: "zigbee";
  globalProperty: string;
  segmentProperty: string;
  globalEffects: Record<string, string>;
  segmentEffects: Record<string, string>;
}
export const BLUE_NOTIFICATION_SWITCH_TYPES: BlueNotificationSwitchDef[] = [
  {
    aliases: ["vzm30-sn", "vzm30"],
    protocol: "zigbee",
    globalProperty: "led_effect",
    segmentProperty: "individual_led_effect",
    globalEffects: BLUE_GLOBAL_LED_EFFECTS,
    segmentEffects: BLUE_SEGMENT_LED_EFFECTS,
  },
  {
    aliases: ["vzm31-sn", "vzm31"],
    protocol: "zigbee",
    globalProperty: "led_effect",
    segmentProperty: "individual_led_effect",
    globalEffects: BLUE_GLOBAL_LED_EFFECTS,
    segmentEffects: BLUE_SEGMENT_LED_EFFECTS,
  },
  {
    aliases: ["vzm32-sn", "vzm32"],
    protocol: "zigbee",
    globalProperty: "led_effect",
    segmentProperty: "individual_led_effect",
    globalEffects: BLUE_GLOBAL_LED_EFFECTS,
    segmentEffects: BLUE_SEGMENT_LED_EFFECTS,
  },
  {
    aliases: ["vzm35-sn", "vzm35"],
    protocol: "zigbee",
    globalProperty: "led_effect",
    segmentProperty: "individual_led_effect",
    globalEffects: BLUE_GLOBAL_LED_EFFECTS,
    segmentEffects: BLUE_SEGMENT_LED_EFFECTS,
  },
];
export function resolveBlueNotificationSwitch(input: string): BlueNotificationSwitchDef | undefined {
  const key = String(input).toLowerCase();
  return BLUE_NOTIFICATION_SWITCH_TYPES.find((def) => def.aliases.includes(key));
}
export type BlueSceneSwitchType = "VZM30-SN" | "VZM31-SN" | "VZM32-SN" | "VZM35-SN";
function buildActionList(): string[] {
  const clicks = ["single", "release", "held", "double", "triple", "quadruple", "quintuple"];
  const buttons = ["down", "up", "config", "aux_down", "aux_up", "aux_config"];
  const actions: string[] = [];
  for (const button of buttons) {
    for (const click of clicks) {
      actions.push(`${button}_${click}`);
    }
  }
  return actions;
}
export const BLUE_SCENE_ACTIONS: string[] = buildActionList();
export const BLUE_SCENE_BUTTON_MAPS: Record<BlueSceneSwitchType, string[]> = {
  "VZM30-SN": BLUE_SCENE_ACTIONS,
  "VZM31-SN": BLUE_SCENE_ACTIONS,
  "VZM32-SN": BLUE_SCENE_ACTIONS,
  "VZM35-SN": BLUE_SCENE_ACTIONS,
};
