import * as assert from "assert";
import { buildTarget, legacyEntityTargets, resolveTargets } from "../../nodes/shared/targets";
describe("shared/targets", () => {
  describe("buildTarget", () => {
    it("returns an empty object for an undefined or empty list", () => {
      assert.deepStrictEqual(buildTarget(undefined), {});
      assert.deepStrictEqual(buildTarget([]), {});
    });
    it("groups entries by type", () => {
      const result = buildTarget([
        { type: "entity_id", value: "light.kitchen" },
        { type: "entity_id", value: "switch.garage" },
        { type: "area_id", value: "kitchen" },
      ]);
      assert.deepStrictEqual(result, {
        target: { entity_id: ["light.kitchen", "switch.garage"], area_id: ["kitchen"] },
      });
    });
    it("supports every target type", () => {
      const result = buildTarget([
        { type: "entity_id", value: "light.kitchen" },
        { type: "device_id", value: "abc123" },
        { type: "area_id", value: "kitchen" },
        { type: "floor_id", value: "first_floor" },
        { type: "label_id", value: "outdoor" },
      ]);
      assert.deepStrictEqual(result, {
        target: {
          entity_id: ["light.kitchen"],
          device_id: ["abc123"],
          area_id: ["kitchen"],
          floor_id: ["first_floor"],
          label_id: ["outdoor"],
        },
      });
    });
    it("ignores entries with a blank value", () => {
      const result = buildTarget([
        { type: "entity_id", value: "  " },
        { type: "entity_id", value: "light.kitchen" },
      ]);
      assert.deepStrictEqual(result, { target: { entity_id: ["light.kitchen"] } });
    });
    it("trims values", () => {
      const result = buildTarget([{ type: "entity_id", value: "  light.kitchen  " }]);
      assert.deepStrictEqual(result, { target: { entity_id: ["light.kitchen"] } });
    });
    it("ignores an entry with an unrecognized type", () => {
      const result = buildTarget([{ type: "bogus_id" as any, value: "x" }]);
      assert.deepStrictEqual(result, {});
    });
  });
  describe("legacyEntityTargets", () => {
    it("returns an empty array for undefined or an empty string", () => {
      assert.deepStrictEqual(legacyEntityTargets(undefined), []);
      assert.deepStrictEqual(legacyEntityTargets(""), []);
    });
    it("splits a comma-delimited string into individual entity_id entries", () => {
      assert.deepStrictEqual(legacyEntityTargets("light.a, switch.b ,light.c"), [
        { type: "entity_id", value: "light.a" },
        { type: "entity_id", value: "switch.b" },
        { type: "entity_id", value: "light.c" },
      ]);
    });
    it("handles a single entity ID with no commas", () => {
      assert.deepStrictEqual(legacyEntityTargets("light.a"), [{ type: "entity_id", value: "light.a" }]);
    });
  });
  describe("resolveTargets", () => {
    const configured = [
      { type: "entity_id" as const, value: "light.configured" },
      { type: "area_id" as const, value: "kitchen" },
    ];
    it("returns the configured targets unchanged when there's no payload override", () => {
      assert.deepStrictEqual(resolveTargets(configured, undefined), configured);
    });
    it("replaces only the entity_id entries when a payload override is given", () => {
      const result = resolveTargets(configured, "light.override");
      assert.deepStrictEqual(result, [
        { type: "area_id", value: "kitchen" },
        { type: "entity_id", value: "light.override" },
      ]);
    });
    it("falls back to the configured targets for a falsy payload override, matching the old `||` behavior", () => {
      assert.deepStrictEqual(resolveTargets(configured, ""), configured);
      assert.deepStrictEqual(resolveTargets(configured, null), configured);
    });
  });
});
