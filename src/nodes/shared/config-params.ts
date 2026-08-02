// Registry for the Config Manager node. Deliberately limited to properties
// that are a single, whole Z-Wave parameter (no bitmask sub-addressing, no
// firmware-version-dependent meaning) - transcribed from the same
// multicast/*.json device configs already used elsewhere in this repo (plus
// zwave-js's published LZW45 config for the properties not yet mirrored
// into multicast/lzw45.json).
//
// Association Behavior and Smart Bulb Mode are intentionally NOT here yet:
// Association Behavior packs multiple named bits into one parameter on
// LZW31-SN but has no documented bit breakdown on LZW30-SN, and Smart Bulb
// Mode's value meaning changes across firmware versions on LZW31-SN. Both
// need more careful per-model handling before being added.
//
// Also deliberately excluded: Energy Reports on LZW31-SN (its units change
// with firmware - 0-100% pre-1.43, 0.01 kWh post-1.43) and on LZW45 (its
// 0-127 range doesn't match the plain 0-100% used everywhere else, a sign
// its units differ too). Instant On is only unified across LZW30-SN/LZW36,
// which share identical option wording and direction (Enabled=0/Disabled=1)
// - LZW31-SN's "Button Delay" and LZW45's "Disable Physical On/Off Delay"
// describe the same underlying feature but with the OPPOSITE direction
// (Disabled=0/Enabled=1), so they're kept as their own thing rather than
// force-unified under one property key. Brightness/Speed After Power
// Restored is LZW36-only for the same reason LZW31-SN's version (parameter
// 11) is excluded: its option values (100 vs 101 for "previous state")
// literally differ by firmware version.

export type ConfigPropertyKey =
  | "autoOffTimer"
  | "autoOffFanTimer"
  | "powerOnState"
  | "localProtection"
  | "invertSwitch"
  | "ledStripTimeout"
  | "ledStripTimeoutFan"
  | "activePowerReports"
  | "periodicPowerEnergyReports"
  | "energyReports"
  | "loadType"
  | "instantOn"
  | "stateAfterPowerFailure"
  | "minLevel"
  | "maxLevel"
  | "minFanLevel"
  | "maxFanLevel"
  | "brightnessAfterPowerRestored"
  | "fanSpeedAfterPowerRestored"
  | "dimmingSpeedZwave"
  | "dimmingSpeedManual"
  | "rampRateZwave"
  | "rampRateManual";

export type ConfigValueType = "duration" | "number" | "enum";

export interface ConfigPropertyDef {
  label: string;
  param: number;
  type: ConfigValueType;
  min?: number; // "number" only
  max?: number; // "duration"/"number"
  options?: Record<string, number>; // "enum" only, lowercase name -> value
}

export interface ConfigSwitchDef {
  aliases: string[];
  properties: Partial<Record<ConfigPropertyKey, ConfigPropertyDef>>;
}

export const POWER_ON_STATE_OPTIONS: Record<string, number> = {
  "prior state": 0,
  on: 1,
  off: 2,
};

export const LOCAL_PROTECTION_OPTIONS: Record<string, number> = {
  none: 0,
  light: 1,
  fan: 2,
  both: 3,
};

export const ENABLE_DISABLE_OPTIONS: Record<string, number> = {
  disabled: 0,
  enabled: 1,
};

export const LOAD_TYPE_OPTIONS: Record<string, number> = {
  "automatically detect load type": 0,
  "manually set for special load type": 1,
};

// Note the direction here: Enabled=0 means Instant On IS enabled (the
// 700ms delay is off); Disabled=1 means Instant On is off (delay present).
export const INSTANT_ON_OPTIONS: Record<string, number> = {
  enabled: 0,
  disabled: 1,
};

export const STATE_AFTER_POWER_FAILURE_OPTIONS: Record<string, number> = {
  off: 0,
  "default color/level": 1,
  "previous state": 2,
};

export const CONFIG_SWITCH_TYPES: ConfigSwitchDef[] = [
  {
    aliases: ["lzw30-sn", "lzw30", "switch", "on/off"],
    properties: {
      autoOffTimer: { label: "Auto-Off Timer", param: 3, type: "duration", max: 32767 },
      powerOnState: { label: "Power On State", param: 1, type: "enum", options: POWER_ON_STATE_OPTIONS },
      invertSwitch: { label: "Invert Switch", param: 2, type: "enum", options: ENABLE_DISABLE_OPTIONS },
      ledStripTimeout: { label: "LED Strip Timeout", param: 9, type: "duration", max: 10 },
      activePowerReports: { label: "Active Power Reports (%)", param: 10, type: "number", min: 0, max: 100 },
      periodicPowerEnergyReports: {
        label: "Periodic Power & Energy Reports",
        param: 11,
        type: "duration",
        max: 32767,
      },
      energyReports: { label: "Energy Reports (%)", param: 12, type: "number", min: 0, max: 100 },
      loadType: { label: "Load Type", param: 13, type: "enum", options: LOAD_TYPE_OPTIONS },
      instantOn: { label: "Instant On", param: 51, type: "enum", options: INSTANT_ON_OPTIONS },
    },
  },
  {
    aliases: ["lzw31-sn", "lzw31", "dimmer"],
    properties: {
      autoOffTimer: { label: "Auto-Off Timer", param: 8, type: "duration", max: 32767 },
      invertSwitch: { label: "Invert Switch", param: 7, type: "enum", options: ENABLE_DISABLE_OPTIONS },
      ledStripTimeout: { label: "LED Indicator Timeout", param: 17, type: "duration", max: 10 },
      activePowerReports: {
        label: "Power Report Threshold (%)",
        param: 18,
        type: "number",
        min: 0,
        max: 100,
      },
      periodicPowerEnergyReports: {
        label: "Power & Energy Report Interval",
        param: 19,
        type: "duration",
        max: 32767,
      },
      minLevel: { label: "Minimum Dim Level (%)", param: 5, type: "number", min: 1, max: 45 },
      maxLevel: { label: "Maximum Dim Level (%)", param: 6, type: "number", min: 55, max: 99 },
      // Dimming Speed/Ramp Rate's max is also their "synced with the Z-Wave
      // parameter"/"immediate" sentinel value - see each device's manual.
      dimmingSpeedZwave: { label: "Dimming Speed (Z-Wave)", param: 1, type: "duration", max: 100 },
      dimmingSpeedManual: { label: "Dimming Speed (Manual)", param: 2, type: "duration", max: 101 },
      rampRateZwave: { label: "Ramp Rate (Z-Wave)", param: 3, type: "duration", max: 101 },
      rampRateManual: { label: "Ramp Rate (Manual)", param: 4, type: "duration", max: 101 },
    },
  },
  {
    aliases: ["lzw36"],
    properties: {
      autoOffTimer: { label: "Auto-Off Timer (Light)", param: 10, type: "duration", max: 32767 },
      autoOffFanTimer: { label: "Auto-Off Timer (Fan)", param: 11, type: "duration", max: 32767 },
      localProtection: {
        label: "Local Protection",
        param: 31,
        type: "enum",
        options: LOCAL_PROTECTION_OPTIONS,
      },
      ledStripTimeout: { label: "LED Strip Timeout (Light)", param: 26, type: "duration", max: 10 },
      ledStripTimeoutFan: { label: "LED Strip Timeout (Fan)", param: 27, type: "duration", max: 10 },
      activePowerReports: { label: "Active Power Reports (%)", param: 28, type: "number", min: 0, max: 100 },
      periodicPowerEnergyReports: {
        label: "Periodic Power & Energy Reports",
        param: 29,
        type: "duration",
        max: 32767,
      },
      energyReports: { label: "Energy Reports (%)", param: 30, type: "number", min: 0, max: 100 },
      instantOn: { label: "Instant On", param: 51, type: "enum", options: INSTANT_ON_OPTIONS },
      minLevel: { label: "Minimum Light Level (%)", param: 5, type: "number", min: 1, max: 45 },
      maxLevel: { label: "Maximum Light Level (%)", param: 6, type: "number", min: 55, max: 99 },
      minFanLevel: { label: "Minimum Fan Level (%)", param: 7, type: "number", min: 1, max: 45 },
      maxFanLevel: { label: "Maximum Fan Level (%)", param: 8, type: "number", min: 55, max: 99 },
      brightnessAfterPowerRestored: {
        label: "Light Brightness After Power Restored",
        param: 16,
        type: "number",
        min: 0,
        max: 100,
      },
      fanSpeedAfterPowerRestored: {
        label: "Fan Speed After Power Restored",
        param: 17,
        type: "number",
        min: 0,
        max: 100,
      },
      dimmingSpeedZwave: { label: "Light Dimming Speed (Z-Wave)", param: 1, type: "duration", max: 98 },
      dimmingSpeedManual: { label: "Light Dimming Speed", param: 2, type: "duration", max: 99 },
      rampRateZwave: { label: "Light Ramp Rate (Z-Wave)", param: 3, type: "duration", max: 99 },
      rampRateManual: { label: "Light Ramp Rate", param: 4, type: "duration", max: 99 },
    },
  },
  {
    aliases: ["lzw45", "light strip", "lightstrip"],
    properties: {
      autoOffTimer: { label: "Auto-Off Timer", param: 6, type: "duration", max: 32767 },
      activePowerReports: { label: "Active Power Reports (%)", param: 17, type: "number", min: 0, max: 100 },
      periodicPowerEnergyReports: {
        label: "Periodic Power & Energy Reports",
        param: 18,
        type: "duration",
        max: 32767,
      },
      stateAfterPowerFailure: {
        label: "State After Power Failure",
        param: 10,
        type: "enum",
        options: STATE_AFTER_POWER_FAILURE_OPTIONS,
      },
    },
  },
];

export function resolveConfigSwitch(input: string): ConfigSwitchDef {
  const key = String(input).toLowerCase();
  const found = CONFIG_SWITCH_TYPES.find((def) => def.aliases.includes(key));
  if (!found) {
    throw new Error(`Incorrect Switch Type: ${input}`);
  }
  return found;
}
