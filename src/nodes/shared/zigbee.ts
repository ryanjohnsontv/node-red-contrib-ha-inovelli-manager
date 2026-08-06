export function parseFriendlyNames(input: unknown): string[] {
  if (!input) {
    return [];
  }
  return String(input)
    .split(",")
    .map((name) => name.trim())
    .filter(Boolean);
}
export function resolveFriendlyNames(configured: string[], payloadOverride: unknown): string[] {
  if (!payloadOverride) {
    return configured;
  }
  return parseFriendlyNames(payloadOverride);
}
export interface ZigbeeMsg {
  topic: string;
  payload: unknown;
}
export function buildZigbeeMsg(friendlyName: string, property: string, value: unknown): ZigbeeMsg {
  return { topic: `zigbee2mqtt/${friendlyName}/set/${property}`, payload: value };
}
