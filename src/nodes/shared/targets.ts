export type TargetType = "entity_id" | "device_id" | "area_id" | "floor_id" | "label_id";
export interface TargetEntry {
  type: TargetType;
  value: string;
}
export type Target = Partial<Record<TargetType, string[]>>;
export const TARGET_TYPES: TargetType[] = ["entity_id", "device_id", "area_id", "floor_id", "label_id"];
export function buildTarget(entries: TargetEntry[] | undefined): {
  target?: Target;
} {
  if (!Array.isArray(entries) || entries.length === 0) {
    return {};
  }
  const target: Target = {};
  for (const entry of entries) {
    if (!entry || !TARGET_TYPES.includes(entry.type)) {
      continue;
    }
    const value = String(entry.value ?? "").trim();
    if (!value) {
      continue;
    }
    (target[entry.type] ??= []).push(value);
  }
  return Object.keys(target).length > 0 ? { target } : {};
}
export function legacyEntityTargets(entityid: string | undefined): TargetEntry[] {
  if (!entityid) {
    return [];
  }
  return String(entityid)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .map((value) => ({ type: "entity_id" as const, value }));
}
export function resolveTargets(configuredTargets: TargetEntry[], payloadEntityId: unknown): TargetEntry[] {
  if (!payloadEntityId) {
    return configuredTargets;
  }
  const withoutEntities = configuredTargets.filter((entry) => entry.type !== "entity_id");
  return withoutEntities.concat(legacyEntityTargets(String(payloadEntityId)));
}
export function legacyEntityIdField(target: Target | undefined): { entity_id?: string[] } {
  return target?.entity_id ? { entity_id: target.entity_id } : {};
}
