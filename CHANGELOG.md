# Changelog

All notable changes to this project are documented here. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.1.0]

### Added

- **All four nodes now support Inovelli's Blue Series switches** (Zigbee, via Zigbee2MQTT): VZM30-SN
  (On/Off), VZM31-SN (2-in-1 Switch/Dimmer), VZM32-SN (mmWave Dimmer), VZM35-SN (Fan Controller), and
  (Config Manager only) VZM36 (Fan Canopy Module, which has no LED bar or paddle buttons). Which family
  a node instance talks to is determined entirely by the selected Switch Type - the Red Series (Z-Wave)
  path is unchanged for every node.
  - **Config Manager / LED Manager**: Blue Series output is a `{topic, payload}` message for a core
    `mqtt out` node (`zigbee2mqtt/<friendly name>/set/<property>`), one per targeted friendly name per
    property (there's no Blue Series equivalent of a single HA service call fanning out to multiple
    devices). LED Manager's Blue Series properties are the LED bar's global default color/intensity
    when on/off; a new **Color (Off)** property was added (Blue Series has a distinct off-color setting
    Red Series doesn't have).
  - **Notification Manager**: Blue Series sends a composite JSON payload (`{effect, color, level,
    duration}`, plus `led` for one of the 7 individually-addressable LED bar segments) to
    `zigbee2mqtt/<friendly name>/set/led_effect` (global) or `.../individual_led_effect` (segment,
    selected via a new **Segment** field/`msg.payload.segment`). Brightness is natively 0-100 (not
    scaled through the 0-10 range used everywhere else).
  - **Scene Manager**: recognizes a second input shape - a message from a core `mqtt in` node
    subscribed to a Zigbee2MQTT action topic (`msg.topic` ending in `/action`, `msg.payload` a plain
    action string like `down_single`) - alongside the existing Home Assistant event shape, matching
    against a 42-entry action vocabulary (`{down,up,config,aux_down,aux_up,aux_config} x {single,
    release,held,double,triple,quadruple,quintuple}`).
  - A new **Friendly Name(s)** field (also configurable via `msg.payload.friendly_name`) replaces the
    Targets picker (or, for Scene Manager, the Node ID field) for Blue Series switch types, since
    Zigbee2MQTT addresses devices by friendly name rather than an HA entity/device/area/floor/label.
- **LED Manager now supports Blue Series' 7 individually-addressable LED bar segments** (a new
  **Segment** field/`msg.payload.segment`, 0 = whole bar, 1-7 = one segment) and **VZM36** (Fan Canopy
  Module - a single simpler status LED, Color/Brightness only, no segments, no "off" variant).
- **Config Manager's Blue Series parameter dropdown now exposes every confirmed parameter for every
  model** (previously only a "commonly used" subset was in the dropdown) - individual LED bar segments,
  external fan binding, aux switch scenes, and the remaining mmWave/VZM36 parameters are all now
  selectable directly instead of requiring `msg.payload.<propertyName>`.
- Three new Blue Series example flows added under `examples/`.
- **Scene Manager now also supports Inovelli's White Series switches** (Matter-over-Thread): VTM30-SN
  (On/Off), VTM31-SN (2-in-1 Dimmer), VTM35-SN (Fan Switch). Connect the same Home Assistant `events:
  all` node Red Series already uses - White Series button events arrive as generic `state_changed`
  events for a Matter button/event entity, and this node recognizes that shape automatically. Since
  each physical button is its own HA entity (not a sub-field of one message, unlike Red/Blue Series) and
  entity_ids can't be reliably derived, a new **Button Entity IDs** field lets you map each button's
  entity_id (look it up in Home Assistant: Settings > Devices & services > Matter > device > Events >
  button > gear icon > entity_id) to a role name of your choosing. Because the click-type vocabulary
  size varies per device, White Series always behaves in Single Output style: one output, with
  `msg.button` (the role) and `msg.action` (`<role>_<event type>`, e.g. `up_multi_press_2`) set on every
  match. Config/LED/Notification Manager support isn't offered for White Series - Home Assistant's
  Matter integration doesn't currently expose White Series' configuration parameters or LED-notification
  effects generically (only 1-2 of ~38 proprietary settings are reachable via HA at all today, and its
  LED bar is a plain on/off/color light with no duration/effect concept), so there'd be almost nothing
  for those nodes to manage.
- **Config Manager, LED Manager, and Notification Manager now accept `device_id`/`area_id`/
  `floor_id`/`label_id` overrides, alongside the existing `entity_id` override.** Setting
  `msg.payload.device_id`, `msg.payload.area_id`, `msg.payload.floor_id`, or `msg.payload.label_id`
  (each a single ID, a comma-delimited list, or an array) independently replaces only that target
  type's configured rows for that run — the other types (including any configured Entity targets)
  are left untouched, same as the existing `entity_id` override behavior.

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
  automatically at runtime and in the editor.
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
