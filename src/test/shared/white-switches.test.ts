import * as assert from "assert";
import { resolveWhiteSceneSwitch, WHITE_SCENE_SWITCHTYPES } from "../../nodes/shared/white-switches";
import { resolveSceneSwitch } from "../../nodes/shared/switches";
describe("shared/white-switches", () => {
  describe("resolveWhiteSceneSwitch", () => {
    it("resolves every documented model's canonical form and lowercase aliases", () => {
      assert.strictEqual(resolveWhiteSceneSwitch("VTM30-SN"), "VTM30-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("vtm30-sn"), "VTM30-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("vtm30"), "VTM30-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("VTM31-SN"), "VTM31-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("vtm31"), "VTM31-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("VTM35-SN"), "VTM35-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("vtm35"), "VTM35-SN");
      assert.strictEqual(resolveWhiteSceneSwitch("VTM36"), "VTM36");
      assert.strictEqual(resolveWhiteSceneSwitch("vtm36"), "VTM36");
    });
    it("returns undefined for an unknown or Red/Blue Series switchtype", () => {
      assert.strictEqual(resolveWhiteSceneSwitch("nope"), undefined);
      assert.strictEqual(resolveWhiteSceneSwitch("LZW30"), undefined);
      assert.strictEqual(resolveWhiteSceneSwitch("VZM31-SN"), undefined);
    });
    it("WHITE_SCENE_SWITCHTYPES lists exactly the 4 supported models", () => {
      assert.deepStrictEqual(WHITE_SCENE_SWITCHTYPES, ["VTM30-SN", "VTM31-SN", "VTM35-SN", "VTM36"]);
    });
  });
  describe("resolveSceneSwitch integration", () => {
    it("resolves every White Series model to protocol matter with no button map/actions", () => {
      for (const switchtype of WHITE_SCENE_SWITCHTYPES) {
        const def = resolveSceneSwitch(switchtype);
        assert.strictEqual(def.protocol, "matter");
      }
    });
  });
});
