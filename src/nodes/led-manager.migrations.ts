import { LedPropertyKey } from "./shared/switches";

export interface LedProperty {
  property: LedPropertyKey;
  value: number;
}

export interface LegacyLedConfig {
  color?: number;
  brightness?: number;
  brightnessOff?: number;
  fanColor?: number;
  fanBrightness?: number;
  fanBrightnessOff?: number;
  toggleColor?: boolean;
  toggleBrightness?: boolean;
  toggleBrightnessOff?: boolean;
  toggleFanColor?: boolean;
  toggleFanBrightness?: boolean;
  toggleFanBrightnessOff?: boolean;
}

/**
 * Pre-1.0 flows stored six fixed color/brightness fields plus a toggle
 * checkbox for each, instead of today's ordered `properties` list. Synthesize
 * an equivalent properties list from that shape so upgraded flows keep
 * sending exactly what they used to without the user reopening the node.
 */
export function legacyLedProperties(config: LegacyLedConfig): LedProperty[] {
  const properties: LedProperty[] = [];
  const add = (
    toggle: boolean | undefined,
    property: LedPropertyKey,
    value: number | undefined,
    fallback: number
  ): void => {
    if (toggle) {
      // Pre-1.0 flow JSON stores these as strings (the editor's <input
      // type="range"> always serializes to a string), so coerce here just
      // like the constructor used to (`parseInt(color, 10)` etc.) - otherwise
      // downstream numeric-typed consumers like parseColor's `typeof ===
      // "number"` branch silently take the wrong path for every upgraded flow.
      properties.push({ property, value: Number(value ?? fallback) });
    }
  };
  add(config.toggleColor, "color", config.color, 180);
  add(config.toggleBrightness, "brightness", config.brightness, 5);
  add(config.toggleBrightnessOff, "brightnessOff", config.brightnessOff, 1);
  add(config.toggleFanColor, "fanColor", config.fanColor, 180);
  add(config.toggleFanBrightness, "fanBrightness", config.fanBrightness, 5);
  add(config.toggleFanBrightnessOff, "fanBrightnessOff", config.fanBrightnessOff, 1);
  return properties;
}
