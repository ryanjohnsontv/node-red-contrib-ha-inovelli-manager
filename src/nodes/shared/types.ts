export interface HAServiceMsg {
  payload: {
    action: `zwave_js.${string}`;
    data: Record<string, unknown>;
  };
}

export function entityIds(input: string | undefined): { entity_id?: string } {
  return input ? { entity_id: input } : {};
}
