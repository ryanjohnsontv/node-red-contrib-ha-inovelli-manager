import convert = require("color-convert");

export type RGB = [number, number, number];

/**
 * Accepts an RGB array, a hex/keyword color string, or an Inovelli-style
 * hue value (0-360, with 361 reserved for white) and normalizes it to RGB.
 */
export function parseColor(input: unknown, source: string): RGB {
  if (Array.isArray(input)) {
    if (input.length !== 3) {
      throw new Error(`Invalid array format for ${source}: ${JSON.stringify(input)}`);
    }
    const [r, g, b] = input as [number, number, number];
    if (r > 255 || g > 255 || b > 255) {
      throw new Error(`RGB values exceed 255 for ${source}: ${JSON.stringify(input)}`);
    }
    return [r, g, b];
  }
  if (typeof input === "string") {
    if (input.startsWith("#")) {
      return convert.hex.rgb(input) as RGB;
    }
    const keyword = input.replace(" ", "").toLowerCase();
    const rgb = convert.keyword.rgb(keyword as never);
    if (!rgb) {
      throw new Error(`Incorrect Color for ${source}: ${input}.`);
    }
    return rgb as RGB;
  }
  if (typeof input === "number") {
    if (input < 0 || input > 361) {
      throw new Error(`Incorrect Color for ${source}: ${input}.`);
    }
    if (input === 361) {
      return [255, 255, 255];
    }
    return convert.hsv.rgb([input, 100, 100]) as RGB;
  }
  throw new Error(`Incorrect Color for ${source}: ${input}.`);
}

/**
 * Converts RGB to the 0-255 scaled hue value Inovelli parameters expect
 * (realHue / 360 * 255), plus a human-readable color keyword for node status.
 */
export function rgbToHue(rgb: RGB): { hue: number; keyword: string } {
  if (rgb[0] === rgb[1] && rgb[1] === rgb[2]) {
    return { hue: 255, keyword: "white" };
  }
  const hslHue = convert.rgb.hsl(rgb)[0];
  const keyword = convert.rgb.keyword(convert.hsl.rgb([hslHue, 100, 50]));
  const hue = Math.round(hslHue * (17 / 24));
  return { hue, keyword };
}
