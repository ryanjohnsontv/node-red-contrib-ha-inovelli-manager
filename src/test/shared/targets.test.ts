import * as assert from "assert";
import {
  buildTarget,
  legacyEntityIdField,
  legacyEntityTargets,
  resolveTargets,
} from "../../nodes/shared/targets";
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
      assert.deepStrictEqual(resolveTargets(configured, {}), configured);
      assert.deepStrictEqual(resolveTargets(configured, null), configured);
    });
    it("replaces only the entity_id entries when payload.entity_id is given", () => {
      const result = resolveTargets(configured, { entity_id: "light.override" });
      assert.deepStrictEqual(result, [
        { type: "area_id", value: "kitchen" },
        { type: "entity_id", value: "light.override" },
      ]);
    });
    it("replaces only the area_id entries when payload.area_id is given, leaving entity_id alone", () => {
      const result = resolveTargets(configured, { area_id: "office" });
      assert.deepStrictEqual(result, [
        { type: "entity_id", value: "light.configured" },
        { type: "area_id", value: "office" },
      ]);
    });
    it("adds device_id/floor_id/label_id entries even though none were configured for those types", () => {
      const result = resolveTargets(configured, {
        device_id: "abc123",
        floor_id: "first_floor",
        label_id: "outdoor",
      });
      assert.deepStrictEqual(result, [
        { type: "entity_id", value: "light.configured" },
        { type: "area_id", value: "kitchen" },
        { type: "device_id", value: "abc123" },
        { type: "floor_id", value: "first_floor" },
        { type: "label_id", value: "outdoor" },
      ]);
    });
    it("resolves multiple override types in the same call independently", () => {
      const result = resolveTargets(configured, { entity_id: "light.override", area_id: "office" });
      assert.deepStrictEqual(result, [
        { type: "entity_id", value: "light.override" },
        { type: "area_id", value: "office" },
      ]);
    });
    it("accepts a comma-delimited string for multiple values of the same type", () => {
      const result = resolveTargets(configured, { device_id: "abc123, def456 ,ghi789" });
      assert.deepStrictEqual(result, [
        { type: "entity_id", value: "light.configured" },
        { type: "area_id", value: "kitchen" },
        { type: "device_id", value: "abc123" },
        { type: "device_id", value: "def456" },
        { type: "device_id", value: "ghi789" },
      ]);
    });
    it("accepts a real array for multiple values of the same type", () => {
      const result = resolveTargets(configured, { device_id: ["abc123", "def456"] });
      assert.deepStrictEqual(result, [
        { type: "entity_id", value: "light.configured" },
        { type: "area_id", value: "kitchen" },
        { type: "device_id", value: "abc123" },
        { type: "device_id", value: "def456" },
      ]);
    });
    it("falls back to the configured targets for a falsy or empty override value", () => {
      assert.deepStrictEqual(resolveTargets(configured, { entity_id: "" }), configured);
      assert.deepStrictEqual(resolveTargets(configured, { entity_id: null }), configured);
      assert.deepStrictEqual(resolveTargets(configured, { device_id: [] }), configured);
    });
  });
  describe("legacyEntityIdField", () => {
    it("returns entity_id when the target has one", () => {
      assert.deepStrictEqual(legacyEntityIdField({ entity_id: ["light.kitchen"] }), {
        entity_id: ["light.kitchen"],
      });
    });
    it("returns an empty object when there's no entity_id", () => {
      assert.deepStrictEqual(legacyEntityIdField({ area_id: ["kitchen"] }), {});
      assert.deepStrictEqual(legacyEntityIdField(undefined), {});
    });
  });
});
