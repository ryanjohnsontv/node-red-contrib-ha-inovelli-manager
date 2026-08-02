# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0]

### Breaking

- **Z-Wave JS only.** OpenZWave and the legacy `zwave` Home Assistant integration are no longer
  supported (both have been gone from Home Assistant for years). No action needed if you were
  already on Z-Wave JS — switch-type values weren't renumbered, and any leftover `zwave`/`nodeid`
  fields in your saved flows are simply ignored.
- **LED Manager config format changed** from six fixed color/brightness fields with toggle
  checkboxes to a single ordered "properties" list (the same "+ add" pattern as the core
  Switch/Change nodes). Existing flows are migrated automatically at runtime and in the editor —
  no action needed, ever; nothing needs to be re-saved for the node to work correctly.
- **Output format changed** from `{domain, service, data}` to `{action, target, data}`, matching
  node-red-contrib-home-assistant-websocket's modern **Action** node (its input format has moved
  on from the older `api-call-service` shape — see `docs/node/action.md` in that project). If your
  flow already uses an Action node downstream, nothing to do. If you're still on the deprecated
  `api-call-service` node, switch to Action. LED Manager, Notification Manager, and Config Manager
  also set a top-level `msg.entity_id` alongside `msg.payload.target.entity_id`, so flows where the
  downstream Action node's own Target field is configured to read directly from `msg.entity_id`
  (rather than relying on the `target` object) keep working without changes.
- **"Entity ID(s)" text field replaced with a Targets picker** (Entity/Device/Area/Floor/Label) on
  LED Manager, Notification Manager, and Config Manager — matching the Action node's own Targets
  UI, including live autocomplete suggestions (sourced from node-red-contrib-home-assistant-
  websocket's public comms topics, when that package is installed and configured — degrades to a
  plain text field otherwise). Existing `entityid` values are migrated into the new Targets list
  automatically at runtime and in the editor, with the same one-time `node.warn()` pattern as the
  LED Manager properties migration above.
- **Scene Manager: "Entity ID(s)" replaced with a generic Message Fields list** instead of the
  Targets picker above — this node doesn't call an HA action, so it isn't tied to HA's
  Entity/Device/Area/Floor/Label targeting at all. Each row is just a field name and a value,
  set directly on the outgoing message (`msg[name] = value`), for whatever the downstream flow
  needs. Existing `entityid` values are migrated automatically into a single `entity_id` field.

### Added

- Full support for **LZW45** (Light Strip & Controller Kit) across all three nodes:
  - Notification Manager: **Quick Effect** (parameter 21, temporary color/brightness/duration/
    effect overlay) and **Pixel Effect** (parameter 31, 45 built-in animations like Rainbow,
    Fireworks, Aurora).
  - Scene Manager: button mapping (already present pre-1.0).
  - LED Manager: intentionally not added — the LZW45 has no indicator parameter distinct from its
    primary light output.
- LED Manager and Notification Manager color sliders now show a live color swatch and a friendly
  nearest-color-name label alongside the raw hue value.
- LED Manager reports every property it sent in a single combined node status
  (e.g. `Color: Red, Brightness: 7, Fan Brightness: 3`) instead of only the last one.
- Notification Manager's status now includes brightness, effect, and duration, not just color.
- `multicast/lzw45.json` added alongside the existing LZW30-SN/LZW31-SN/LZW36 multicast configs.
- Scene Manager: optional **Single Output** mode. Instead of one wire per button/scene combination
  (18 for the LZW36), route everything through one output using `msg.topic` (the matched
  combination's index) plus `msg.button`/`msg.scene`. Off by default — existing flows keep their
  current wiring.
- **New node: Config Manager.** Sets miscellaneous parameters that aren't LED/notification/scene
  related, using the same "+add" property list as LED Manager: Auto-Off Timer (all four models,
  separate Fan timer on the LZW36), Power On State (LZW30-SN only), State After Power Failure
  (LZW45's own version, different options), Local Protection (LZW36 only), Invert Switch
  (LZW30-SN/LZW31-SN), LED Strip Timeout (separate Fan timer on the LZW36), Active Power Reports,
  Periodic Power & Energy Reports, Energy Reports (LZW30-SN/LZW36 only), Load Type (LZW30-SN
  only), and Instant On (LZW30-SN/LZW36 only). Association Behavior and Smart Bulb Mode are
  intentionally not included yet — both need more careful per-model handling (bitmask sub-fields
  on one model only, and firmware-version-dependent meaning, respectively) before being added.
  Energy Reports and Instant On are each deliberately scoped to fewer than all four models too,
  for similar reasons (firmware-dependent units, and inverted option direction on the excluded
  models, respectively) — see the README for details.
- LED Manager's and Config Manager's "+add" button now disables itself once every property valid
  for the current switch type is already in the list, instead of adding a row that can only show
  a disabled "(all properties already added)" placeholder.
- Config Manager: 10 more properties — Minimum/Maximum Level (LZW31-SN, LZW36 light channel),
  Minimum/Maximum Fan Level (LZW36), Light Brightness After Power Restored / Fan Speed After Power
  Restored (LZW36 only — LZW31-SN's equivalent parameter has firmware-version-dependent option
  values, same exclusion reasoning as Energy Reports/Instant On), and Dimming Speed/Ramp Rate
  (Z-Wave and Manual variants, LZW31-SN and LZW36 light channel, each model keeping its own max
  value). Also fixed a labeling gap on the LZW36: properties that exist for both its light and fan
  channels (Auto-Off Timer, LED Strip Timeout) now say "(Light)" in the dropdown instead of
  showing an unqualified name next to the "(Fan)" one.

### Changed

- Node logic rewritten in TypeScript (`nodes/*.ts`, compiled to `nodes/*.js` at build/publish
  time — no change to how the package is installed or used).
- "Use Multicast" checkbox relabeled to "Multicast" for consistency with the other checkboxes in
  this package ("Clear Notification", "Node ID Passthrough").
- Fixed a brightness validation bug that silently accepted 11 (out of the documented 0-10 range).

### Fixed

- CI now runs the test suite before every publish, and on every push/PR (see `test.yml`).
- Fractional values (most likely from a payload override, e.g. `msg.payload.brightness = 7.6`)
  now round to the nearest integer before being validated and sent, instead of reaching the
  device as a non-integer config parameter value. Affected LED Manager and Notification Manager's
  brightness handling, Config Manager's numeric properties, and both shared duration parsers.
