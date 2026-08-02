import { Target } from "./targets";
export interface HAActionMsg {
  payload: {
    action: string;
    target?: Target;
    data: Record<string, unknown>;
  };
}
