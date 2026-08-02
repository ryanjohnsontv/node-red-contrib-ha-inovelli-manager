export interface HAServiceMsg {
  payload: {
    domain: "zwave_js";
    service: string;
    data: Record<string, unknown>;
  };
}

export function entityIds(input: string | undefined): { entity_id?: string } {
  return input ? { entity_id: input } : {};
}
