import { ConfigPropertyDef, ConfigPropertyKey, ConfigSwitchDef } from "./config-params";
const YES_NO: string[] = ["No", "Yes"];
const DISABLED_ENABLED: string[] = ["Disabled", "Enabled"];
const LOAD_LEVEL_INDICATOR_TIMEOUT: string[] = [
  "Stay Off",
  "1 Second",
  "2 Seconds",
  "3 Seconds",
  "4 Seconds",
  "5 Seconds",
  "6 Seconds",
  "7 Seconds",
  "8 Seconds",
  "9 Seconds",
  "10 Seconds",
  "Stay On",
];
const SWITCH_TYPE_SINGLE_AUX: string[] = ["Single Pole", "Aux Switch"];
const SWITCH_TYPE_2IN1: string[] = [
  "Single Pole",
  "3-Way Dumb Switch",
  "3-Way Aux Switch",
  "Single-Pole Full Sine Wave",
];
const HIGHER_OUTPUT_NON_NEUTRAL: string[] = ["Disabled (default)", "Enabled"];
const BUTTON_PRESS_DELAY: string[] = [
  "0ms",
  "100ms",
  "200ms",
  "300ms",
  "400ms",
  "500ms",
  "600ms",
  "700ms",
  "800ms",
  "900ms",
];
const SMART_BULB_MODE: string[] = ["Disabled", "Smart Bulb Mode"];
const SMART_FAN_MODE: string[] = ["Disabled", "Smart Fan Mode"];
const LED_BAR_SCALING: string[] = ["Gen3 method (VZM-style)", "Gen2 method (LZW-style)"];
const SINGLE_TAP_BEHAVIOR: string[] = ["Old Behavior", "New Behavior", "Down Always Off"];
const FAN_CONTROL_MODE: string[] = ["Disabled", "Multi Tap", "Cycle"];
const RELAY_CLICK: string[] = ["Disabled (Click Sound On)", "Enabled (Click Sound Off)"];
const CLEAR_NOTIFICATIONS_2X_TAP: string[] = ["Enabled (Default)", "Disabled"];
const LIGHT_ON_PRESENCE_BEHAVIOR: string[] = [
  "Disabled",
  "Occupancy (default)",
  "Vacancy",
  "Wasteful Occupancy",
  "Mirrored Occupancy",
  "Mirrored Vacancy",
  "Mirrored Wasteful Occupancy",
];
const MMWAVE_SENSITIVITY: string[] = ["Low", "Medium", "High (default)"];
const MMWAVE_DETECTION_DELAY: string[] = ["Slow (5s)", "Medium (1s)", "Fast (0.2s, default)"];
const MMWAVE_TARGET_REPORT: string[] = ["Disable (default)", "Enable"];
const ROOM_SIZE_PRESET: string[] = ["Custom", "Small", "Medium", "Large"];
const OTA_IMAGE_TYPE: string[] = ["Zigbee (259)", "mmWave (260)", "Alternating (259 & 260) (default)"];
const OUTPUT_MODE_DIMMER: string[] = ["Dimmer", "On/Off"];
const OUTPUT_MODE_FAN: string[] = ["Ceiling Fan (3-Speed)", "Exhaust Fan (On/Off)"];
const ONE_LED_MODE: string[] = ["All", "One"];
type BlueProps = Partial<Record<ConfigPropertyKey, ConfigPropertyDef>>;
const CORE_PROPS: BlueProps = {
  invertSwitch: { label: "Invert Switch", param: "invertSwitch", type: "zigbeeEnum", enumValues: YES_NO },
  autoOffTimer: { label: "Auto-Off Timer", param: "autoTimerOff", type: "duration", max: 32767 },
  loadLevelIndicatorTimeout: {
    label: "LED Indicator Timeout",
    param: "loadLevelIndicatorTimeout",
    type: "zigbeeEnum",
    enumValues: LOAD_LEVEL_INDICATOR_TIMEOUT,
  },
  activePowerReports: {
    label: "Active Power Reports (%)",
    param: "activePowerReports",
    type: "number",
    min: 0,
    max: 100,
  },
  periodicPowerEnergyReports: {
    label: "Periodic Power & Energy Reports",
    param: "periodicPowerAndEnergyReports",
    type: "duration",
    max: 32767,
  },
  energyReports: {
    label: "Active Energy Reports (0.01 kWh)",
    param: "activeEnergyReports",
    type: "number",
    min: 0,
    max: 32767,
  },
  buttonPressDelay: {
    label: "Button Press Delay",
    param: "buttonDelay",
    type: "zigbeeEnum",
    enumValues: BUTTON_PRESS_DELAY,
  },
  singleTapBehavior: {
    label: "Single-Tap Behavior",
    param: "singleTapBehavior",
    type: "zigbeeEnum",
    enumValues: SINGLE_TAP_BEHAVIOR,
  },
  auxSwitchUniqueScenes: {
    label: "Aux Switch Unique Scenes",
    param: "auxSwitchUniqueScenes",
    type: "zigbeeEnum",
    enumValues: DISABLED_ENABLED,
  },
  localProtectionChildLock: {
    label: "Local Protection (Child Lock)",
    param: "localProtection",
    type: "zigbeeEnum",
    enumValues: DISABLED_ENABLED,
  },
  firmwareUpdateInProgressIndicator: {
    label: "Firmware Update Indicator",
    param: "firmwareUpdateInProgressIndicator",
    type: "zigbeeEnum",
    enumValues: DISABLED_ENABLED,
  },
  doubleTapClearNotifications: {
    label: "Clear Notification via 2x Tap",
    param: "doubleTapClearNotifications",
    type: "zigbeeEnum",
    enumValues: CLEAR_NOTIFICATIONS_2X_TAP,
  },
  ledBarScaling: {
    label: "LED Bar Scaling",
    param: "ledBarScaling",
    type: "zigbeeEnum",
    enumValues: LED_BAR_SCALING,
  },
  ledColorWhenOn: {
    label: "Default LED Color (On)",
    param: "ledColorWhenOn",
    type: "number",
    min: 0,
    max: 255,
  },
  ledColorWhenOff: {
    label: "Default LED Color (Off)",
    param: "ledColorWhenOff",
    type: "number",
    min: 0,
    max: 255,
  },
  ledIntensityWhenOn: {
    label: "Default LED Intensity (On)",
    param: "ledIntensityWhenOn",
    type: "number",
    min: 0,
    max: 100,
  },
  ledIntensityWhenOff: {
    label: "Default LED Intensity (Off)",
    param: "ledIntensityWhenOff",
    type: "number",
    min: 0,
    max: 100,
  },
};
function ledSegmentProps(): BlueProps {
  const props: BlueProps = {};
  const segments: [number, number, number, number][] = [
    [1, 60, 61, 62],
    [2, 65, 66, 67],
    [3, 70, 71, 72],
    [4, 75, 76, 77],
    [5, 80, 81, 82],
    [6, 85, 86, 87],
    [7, 90, 91, 92],
  ];
  for (const [n] of segments) {
    (props as Record<string, ConfigPropertyDef>)[`defaultLed${n}ColorWhenOn`] = {
      label: `LED ${n} Color (On)`,
      param: `defaultLed${n}ColorWhenOn`,
      type: "number",
      min: 0,
      max: 255,
    };
    (props as Record<string, ConfigPropertyDef>)[`defaultLed${n}ColorWhenOff`] = {
      label: `LED ${n} Color (Off)`,
      param: `defaultLed${n}ColorWhenOff`,
      type: "number",
      min: 0,
      max: 255,
    };
    (props as Record<string, ConfigPropertyDef>)[`defaultLed${n}IntensityWhenOn`] = {
      label: `LED ${n} Intensity (On)`,
      param: `defaultLed${n}IntensityWhenOn`,
      type: "number",
      min: 0,
      max: 101,
    };
    (props as Record<string, ConfigPropertyDef>)[`defaultLed${n}IntensityWhenOff`] = {
      label: `LED ${n} Intensity (Off)`,
      param: `defaultLed${n}IntensityWhenOff`,
      type: "number",
      min: 0,
      max: 101,
    };
  }
  return props;
}
const DIMMER_LEVEL_PROPS: BlueProps = {
  minimumLevel: { label: "Minimum Level", param: "minimumLevel", type: "number", min: 1, max: 254 },
  maximumLevel: { label: "Maximum Level", param: "maximumLevel", type: "number", min: 2, max: 255 },
  defaultLevelLocal: {
    label: "Default Level (Local)",
    param: "defaultLevelLocal",
    type: "number",
    min: 0,
    max: 255,
  },
  defaultLevelRemote: {
    label: "Default Level (Remote)",
    param: "defaultLevelRemote",
    type: "number",
    min: 0,
    max: 255,
  },
  levelAfterPowerRestored: {
    label: "Level After Power Restored",
    param: "stateAfterPowerRestored",
    type: "number",
    min: 0,
    max: 255,
  },
};
const DIMMING_SPEED_PROPS: BlueProps = {
  dimmingSpeedUpRemote: {
    label: "Dimming Speed Up (Remote)",
    param: "dimmingSpeedUpRemote",
    type: "number",
    min: 0,
    max: 126,
  },
  dimmingSpeedUpLocal: {
    label: "Dimming Speed Up (Local)",
    param: "dimmingSpeedUpLocal",
    type: "number",
    min: 0,
    max: 127,
  },
  rampRateOffToOnRemote: {
    label: "Ramp Rate Off to On (Remote)",
    param: "rampRateOffToOnRemote",
    type: "number",
    min: 0,
    max: 127,
  },
  rampRateOffToOnLocal: {
    label: "Ramp Rate Off to On (Local)",
    param: "rampRateOffToOnLocal",
    type: "number",
    min: 0,
    max: 127,
  },
  dimmingSpeedDownRemote: {
    label: "Dimming Speed Down (Remote)",
    param: "dimmingSpeedDownRemote",
    type: "number",
    min: 0,
    max: 127,
  },
  dimmingSpeedDownLocal: {
    label: "Dimming Speed Down (Local)",
    param: "dimmingSpeedDownLocal",
    type: "number",
    min: 0,
    max: 127,
  },
  rampRateOnToOffRemote: {
    label: "Ramp Rate On to Off (Remote)",
    param: "rampRateOnToOffRemote",
    type: "number",
    min: 0,
    max: 127,
  },
  rampRateOnToOffLocal: {
    label: "Ramp Rate On to Off (Local)",
    param: "rampRateOnToOffLocal",
    type: "number",
    min: 0,
    max: 127,
  },
};
const DOUBLE_TAP_LEVEL_PROPS: BlueProps = {
  enable2xTapUp: {
    label: "2x Tap Up Enable",
    param: "doubleTapUpToParam55",
    type: "zigbeeEnum",
    enumValues: DISABLED_ENABLED,
  },
  enable2xTapDown: {
    label: "2x Tap Down Enable",
    param: "doubleTapDownToParam56",
    type: "zigbeeEnum",
    enumValues: DISABLED_ENABLED,
  },
  brightnessLevelForDoubleTapUp: {
    label: "2x Tap Up Level",
    param: "brightnessLevelForDoubleTapUp",
    type: "number",
    min: 2,
    max: 255,
  },
  brightnessLevelForDoubleTapDown: {
    label: "2x Tap Down Level",
    param: "brightnessLevelForDoubleTapDown",
    type: "number",
    min: 0,
    max: 255,
  },
};
const EXTERNAL_FAN_BINDING_PROPS: BlueProps = {
  fanControlMode: {
    label: "Fan Control Mode (Config Button)",
    param: "fanControlMode",
    type: "zigbeeEnum",
    enumValues: FAN_CONTROL_MODE,
  },
  lowLevelForFanControlMode: {
    label: "Fan Low Level",
    param: "lowLevelForFanControlMode",
    type: "number",
    min: 2,
    max: 254,
  },
  mediumLevelForFanControlMode: {
    label: "Fan Medium Level",
    param: "mediumLevelForFanControlMode",
    type: "number",
    min: 2,
    max: 254,
  },
  highLevelForFanControlMode: {
    label: "Fan High Level",
    param: "highLevelForFanControlMode",
    type: "number",
    min: 2,
    max: 254,
  },
  ledColorForFanControlMode: {
    label: "Fan Control Mode LED Color",
    param: "ledColorForFanControlMode",
    type: "number",
    min: 0,
    max: 255,
  },
};
const MMWAVE_PROPS: BlueProps = {
  mmWaveHeightMin: {
    label: "mmWave Height Minimum (Floor, cm)",
    param: "mmWaveHeightMin",
    type: "number",
    min: -600,
    max: 600,
  },
  mmWaveHeightMax: {
    label: "mmWave Height Maximum (Ceiling, cm)",
    param: "mmWaveHeightMax",
    type: "number",
    min: -600,
    max: 600,
  },
  mmWaveWidthMin: {
    label: "mmWave Width Minimum (Left, cm)",
    param: "mmWaveWidthMin",
    type: "number",
    min: -600,
    max: 600,
  },
  mmWaveWidthMax: {
    label: "mmWave Width Maximum (Right, cm)",
    param: "mmWaveWidthMax",
    type: "number",
    min: -600,
    max: 600,
  },
  mmWaveDepthMin: {
    label: "mmWave Depth Minimum (Near, cm)",
    param: "mmWaveDepthMin",
    type: "number",
    min: 0,
    max: 600,
  },
  mmWaveDepthMax: {
    label: "mmWave Depth Maximum (Far, cm)",
    param: "mmWaveDepthMax",
    type: "number",
    min: 0,
    max: 600,
  },
  mmwaveControlWiredDevice: {
    label: "Light On Presence Behavior",
    param: "mmwaveControlWiredDevice",
    type: "zigbeeEnum",
    enumValues: LIGHT_ON_PRESENCE_BEHAVIOR,
  },
  mmWaveDetectSensitivity: {
    label: "mmWave Detection Sensitivity",
    param: "mmWaveDetectSensitivity",
    type: "zigbeeEnum",
    enumValues: MMWAVE_SENSITIVITY,
  },
  mmWaveDetectTrigger: {
    label: "mmWave Detection Delay",
    param: "mmWaveDetectTrigger",
    type: "zigbeeEnum",
    enumValues: MMWAVE_DETECTION_DELAY,
  },
  mmWaveHoldTime: {
    label: "mmWave Time Out (s)",
    param: "mmWaveHoldTime",
    type: "number",
    min: 0,
    max: 4294967295,
  },
  mmWaveStayLife: {
    label: "mmWave Stay Life",
    param: "mmWaveStayLife",
    type: "number",
    min: 0,
    max: 4294967295,
  },
  mmWaveTargetInfoReport: {
    label: "mmWave Target Info Report",
    param: "mmWaveTargetInfoReport",
    type: "zigbeeEnum",
    enumValues: MMWAVE_TARGET_REPORT,
  },
  mmWaveRoomSizePreset: {
    label: "mmWave Room Size Preset",
    param: "mmWaveRoomSizePreset",
    type: "zigbeeEnum",
    enumValues: ROOM_SIZE_PRESET,
  },
  otaImageType: {
    label: "OTA Image Type",
    param: "otaImageType",
    type: "zigbeeEnum",
    enumValues: OTA_IMAGE_TYPE,
  },
};
export const BLUE_CONFIG_SWITCH_TYPES: ConfigSwitchDef[] = [
  {
    aliases: ["vzm30-sn", "vzm30", "blue on/off"],
    protocol: "zigbee",
    properties: {
      ...CORE_PROPS,
      ...ledSegmentProps(),
      ...EXTERNAL_FAN_BINDING_PROPS,
      switchType: {
        label: "Switch Type",
        param: "switchType",
        type: "zigbeeEnum",
        enumValues: SWITCH_TYPE_SINGLE_AUX,
      },
      smartBulbMode: {
        label: "Smart Bulb Mode",
        param: "smartBulbMode",
        type: "zigbeeEnum",
        enumValues: SMART_BULB_MODE,
      },
      outputMode: {
        label: "Switch Mode",
        param: "outputMode",
        type: "zigbeeEnum",
        enumValues: OUTPUT_MODE_DIMMER,
      },
      oneLedMode: {
        label: "One LED Mode",
        param: "onOffLedMode",
        type: "zigbeeEnum",
        enumValues: ONE_LED_MODE,
      },
    },
  },
  {
    aliases: ["vzm31-sn", "vzm31", "blue dimmer", "blue 2-in-1"],
    protocol: "zigbee",
    properties: {
      ...CORE_PROPS,
      ...ledSegmentProps(),
      ...DIMMER_LEVEL_PROPS,
      ...DIMMING_SPEED_PROPS,
      ...DOUBLE_TAP_LEVEL_PROPS,
      ...EXTERNAL_FAN_BINDING_PROPS,
      switchType: {
        label: "Switch Type",
        param: "switchType",
        type: "zigbeeEnum",
        enumValues: SWITCH_TYPE_2IN1,
      },
      higherOutputInNonNeutral: {
        label: "Higher Output (Non-Neutral)",
        param: "higherOutputInNonNeutral",
        type: "zigbeeEnum",
        enumValues: HIGHER_OUTPUT_NON_NEUTRAL,
      },
      smartBulbMode: {
        label: "Smart Bulb Mode",
        param: "smartBulbMode",
        type: "zigbeeEnum",
        enumValues: SMART_BULB_MODE,
      },
      bindingOffToOnSyncLevel: {
        label: "Binding Default Level",
        param: "bindingOffToOnSyncLevel",
        type: "zigbeeEnum",
        enumValues: DISABLED_ENABLED,
      },
      relayClick: {
        label: "Relay Click Sound",
        param: "relayClick",
        type: "zigbeeEnum",
        enumValues: RELAY_CLICK,
      },
      outputMode: {
        label: "Switch Mode",
        param: "outputMode",
        type: "zigbeeEnum",
        enumValues: OUTPUT_MODE_DIMMER,
      },
    },
  },
  {
    aliases: ["vzm32-sn", "vzm32", "blue mmwave"],
    protocol: "zigbee",
    properties: {
      ...CORE_PROPS,
      ...ledSegmentProps(),
      ...DIMMER_LEVEL_PROPS,
      ...DIMMING_SPEED_PROPS,
      ...DOUBLE_TAP_LEVEL_PROPS,
      ...EXTERNAL_FAN_BINDING_PROPS,
      ...MMWAVE_PROPS,
      switchType: {
        label: "Switch Type",
        param: "switchType",
        type: "zigbeeEnum",
        enumValues: SWITCH_TYPE_SINGLE_AUX,
      },
      higherOutputInNonNeutral: {
        label: "Higher Output (Non-Neutral)",
        param: "higherOutputInNonNeutral",
        type: "zigbeeEnum",
        enumValues: HIGHER_OUTPUT_NON_NEUTRAL,
      },
      smartBulbMode: {
        label: "Smart Bulb Mode",
        param: "smartBulbMode",
        type: "zigbeeEnum",
        enumValues: SMART_BULB_MODE,
      },
      bindingOffToOnSyncLevel: {
        label: "Binding Default Level",
        param: "bindingOffToOnSyncLevel",
        type: "zigbeeEnum",
        enumValues: DISABLED_ENABLED,
      },
      outputMode: {
        label: "Switch Mode",
        param: "outputMode",
        type: "zigbeeEnum",
        enumValues: OUTPUT_MODE_DIMMER,
      },
    },
  },
  {
    aliases: ["vzm35-sn", "vzm35", "blue fan"],
    protocol: "zigbee",
    properties: {
      ...CORE_PROPS,
      ...ledSegmentProps(),
      ...DIMMER_LEVEL_PROPS,
      ...DIMMING_SPEED_PROPS,
      switchType: {
        label: "Switch Type",
        param: "switchType",
        type: "zigbeeEnum",
        enumValues: SWITCH_TYPE_SINGLE_AUX,
      },
      smartBulbMode: {
        label: "Smart Fan Mode",
        param: "smartBulbMode",
        type: "zigbeeEnum",
        enumValues: SMART_FAN_MODE,
      },
      outputMode: { label: "Fan Mode", param: "outputMode", type: "zigbeeEnum", enumValues: OUTPUT_MODE_FAN },
    },
  },
  {
    aliases: ["vzm36", "blue canopy", "fan canopy module"],
    protocol: "zigbee",
    properties: {
      autoOffTimer: {
        label: "Light Auto-Off Timer",
        param: "autoTimerOff_1",
        type: "duration",
        max: 32767,
      },
      autoOffFanTimer: {
        label: "Fan Auto-Off Timer",
        param: "autoTimerOff_2",
        type: "duration",
        max: 32767,
      },
      dimmingSpeedUpRemoteLight: {
        label: "Light Dimming Speed Up",
        param: "dimmingSpeedUpRemote_1",
        type: "number",
        min: 0,
        max: 126,
      },
      rampRateOffToOnRemoteLight: {
        label: "Light Ramp Rate Off to On",
        param: "rampRateOffToOnRemote_1",
        type: "number",
        min: 0,
        max: 127,
      },
      dimmingSpeedDownRemoteLight: {
        label: "Light Dimming Speed Down",
        param: "dimmingSpeedDownRemote_1",
        type: "number",
        min: 0,
        max: 127,
      },
      rampRateOnToOffRemoteLight: {
        label: "Light Ramp Rate On to Off",
        param: "rampRateOnToOffRemote_1",
        type: "number",
        min: 0,
        max: 127,
      },
      minimumLevelLight: {
        label: "Light Minimum Level",
        param: "minimumLevel_1",
        type: "number",
        min: 1,
        max: 254,
      },
      maximumLevelLight: {
        label: "Light Maximum Level",
        param: "maximumLevel_1",
        type: "number",
        min: 2,
        max: 255,
      },
      defaultLevelRemoteLight: {
        label: "Light Default Level",
        param: "defaultLevelRemote_1",
        type: "number",
        min: 0,
        max: 255,
      },
      stateAfterPowerRestoredLight: {
        label: "Light Level After Power Restored",
        param: "stateAfterPowerRestored_1",
        type: "number",
        min: 0,
        max: 255,
      },
      higherOutputInNonNeutralLight: {
        label: "Light Higher Output (Non-Neutral)",
        param: "higherOutputInNonNeutral_1",
        type: "zigbeeEnum",
        enumValues: HIGHER_OUTPUT_NON_NEUTRAL,
      },
      quickStartTimeLight: {
        label: "Light Quick Start Time",
        param: "quickStartTime_1",
        type: "number",
        min: 0,
        max: 60,
      },
      quickStartLevelLight: {
        label: "Light Quick Start Level",
        param: "quickStartLevel_1",
        type: "number",
        min: 1,
        max: 254,
      },
      smartBulbModeLight: {
        label: "Light Smart Bulb Mode",
        param: "smartBulbMode_1",
        type: "zigbeeEnum",
        enumValues: SMART_BULB_MODE,
      },
      ledColorWhenOnLight: {
        label: "Light LED Color",
        param: "ledColorWhenOn_1",
        type: "number",
        min: 0,
        max: 255,
      },
      ledIntensityWhenOnLight: {
        label: "Light LED Intensity",
        param: "ledIntensityWhenOn_1",
        type: "number",
        min: 0,
        max: 100,
      },
      outputModeLight: {
        label: "Light Switch Mode",
        param: "outputMode_1",
        type: "zigbeeEnum",
        enumValues: OUTPUT_MODE_DIMMER,
      },
      dimmingSpeedUpRemoteFan: {
        label: "Fan Speed Up",
        param: "dimmingSpeedUpRemote_2",
        type: "number",
        min: 0,
        max: 126,
      },
      rampRateOffToOnRemoteFan: {
        label: "Fan Ramp Rate Off to On",
        param: "rampRateOffToOnRemote_2",
        type: "number",
        min: 0,
        max: 127,
      },
      dimmingSpeedDownRemoteFan: {
        label: "Fan Speed Down",
        param: "dimmingSpeedDownRemote_2",
        type: "number",
        min: 0,
        max: 127,
      },
      rampRateOnToOffRemoteFan: {
        label: "Fan Ramp Rate On to Off",
        param: "rampRateOnToOffRemote_2",
        type: "number",
        min: 0,
        max: 127,
      },
      minimumLevelFan: {
        label: "Fan Minimum Level",
        param: "minimumLevel_2",
        type: "number",
        min: 1,
        max: 254,
      },
      maximumLevelFan: {
        label: "Fan Maximum Level",
        param: "maximumLevel_2",
        type: "number",
        min: 2,
        max: 255,
      },
      defaultLevelRemoteFan: {
        label: "Fan Default Level",
        param: "defaultLevelRemote_2",
        type: "number",
        min: 0,
        max: 255,
      },
      stateAfterPowerRestoredFan: {
        label: "Fan Level After Power Restored",
        param: "stateAfterPowerRestored_2",
        type: "number",
        min: 0,
        max: 255,
      },
      quickStartTimeFan: {
        label: "Fan Quick Start Time",
        param: "quickStartTime_2",
        type: "number",
        min: 0,
        max: 60,
      },
      smartBulbModeFan: {
        label: "Fan Smart Fan Mode",
        param: "smartBulbMode_2",
        type: "zigbeeEnum",
        enumValues: SMART_FAN_MODE,
      },
      outputModeFan: {
        label: "Fan Switch Mode",
        param: "outputMode_2",
        type: "zigbeeEnum",
        enumValues: OUTPUT_MODE_FAN,
      },
    },
  },
];
