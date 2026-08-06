export type WhiteSceneSwitchType = "VTM30-SN" | "VTM31-SN" | "VTM35-SN" | "VTM36";
export const WHITE_SCENE_SWITCHTYPES: WhiteSceneSwitchType[] = ["VTM30-SN", "VTM31-SN", "VTM35-SN", "VTM36"];
interface WhiteSceneSwitchAliases {
  aliases: string[];
  switchtype: WhiteSceneSwitchType;
}
const WHITE_SCENE_SWITCH_ALIASES: WhiteSceneSwitchAliases[] = [
  { aliases: ["vtm30-sn", "vtm30"], switchtype: "VTM30-SN" },
  { aliases: ["vtm31-sn", "vtm31"], switchtype: "VTM31-SN" },
  { aliases: ["vtm35-sn", "vtm35"], switchtype: "VTM35-SN" },
  { aliases: ["vtm36"], switchtype: "VTM36" },
];
export function resolveWhiteSceneSwitch(input: string): WhiteSceneSwitchType | undefined {
  const key = String(input).toLowerCase();
  return WHITE_SCENE_SWITCH_ALIASES.find((def) => def.aliases.includes(key))?.switchtype;
}
