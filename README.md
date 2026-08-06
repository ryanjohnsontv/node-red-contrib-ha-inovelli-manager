# node-red-contrib-ha-inovelli-manager

Nodes for easily managing scenes, parameters, and notifications of Inovelli switches. Red Series switches pair through Home Assistant's **Z-Wave JS** integration; Blue Series switches are Zigbee and pair through **Zigbee2MQTT**; White Series switches are Matter-over-Thread and pair through Home Assistant's native **Matter** integration.

If you notice any problems please open an issue or a pull request, I'll respond ASAP. Feature requests are always welcome. Thanks!

For Red Series, these nodes should be used in conjunction with the [node-red-contrib-home-assistant-websocket](https://github.com/zachowj/node-red-contrib-home-assistant-websocket) palette, and the output should be connected to an **Action** node, which will automatically fill in the appropriate `action`/`target`/`data` fields. For Blue Series, the output should instead be connected to a core **mqtt out** node — each node automatically emits the right shape for whichever family the selected Switch Type belongs to. White Series is Scene Manager only (see below for why). [Example flows are provided in this repo](https://github.com/ryanjohnsontv/node-red-contrib-ha-inovelli-manager/tree/main/examples).

## Features

- Four nodes: **Notification Manager**, **LED Manager**, **Scene Manager**, **Config Manager**
- Full support for every Inovelli Red Series module: **LZW30-SN** (On/Off), **LZW31-SN** (Dimmer), **LZW36** (Fan/Light), **LZW45** (Light Strip & Controller Kit)
- All four nodes also support Inovelli Blue Series over Zigbee2MQTT: **VZM30-SN** (On/Off), **VZM31-SN** (2-in-1 Switch/Dimmer), **VZM32-SN** (mmWave Dimmer), **VZM35-SN** (Fan Controller) — plus **VZM36** (Fan Canopy Module) for Config Manager only, since it has no LED bar or paddle buttons
- Scene Manager also supports Inovelli White Series (Matter-over-Thread): **VTM30-SN** (On/Off), **VTM31-SN** (2-in-1 Dimmer), **VTM35-SN** (Fan Switch) — Home Assistant's Matter integration doesn't currently expose White Series' configuration parameters or LED-notification effects generically (only 1-2 of ~38 proprietary settings are reachable at all, and its LED bar has no duration/effect concept), so Config/LED/Notification Manager support isn't offered for this line; there'd be almost nothing for those nodes to do
- Multicast support (Red Series)
- Allows all fields to be controlled by the payload of an incoming message
- Uses the `color-convert` library to accept color names, RGB arrays, hexadecimals, or hue values as input
- Automatically converts input values to the proper format (e.g. inputting "2 Hours" converts to 168 for Inovelli math)
- Easily clear notifications

# Inovelli Notification Manager

Forked from the exceptionally wonderful https://github.com/pdong/node-contrib-inovelli-status-manager repo.

This node allows you to set color, brightness, and effect type/duration for notifications on Inovelli switches. No manual calculations needed! Supports both Red Series (Z-Wave) and Blue Series (Zigbee2MQTT) — which family a given node instance talks to is determined entirely by the selected Switch Type.

<img width="480" height="687" alt="Screenshot 2026-08-02 at 03 17 05" src="https://github.com/user-attachments/assets/98077acc-6a69-470e-a809-7e397b052a48" />

## Blue Series

Covers VZM30-SN, VZM31-SN, VZM32-SN, and VZM35-SN (not VZM36 — it has no LED bar). Sends a composite MQTT message instead of Red Series' single bitpacked value:

- **Global** (the default, whole-LED-bar notification): `zigbee2mqtt/<friendly name>/set/led_effect` with payload `{effect, color, level, duration}`.
- **Segment** (one of the 7 individually-addressable LED bar segments): set the **Segment** field (1-7; 0 = global) to instead target `zigbee2mqtt/<friendly name>/set/individual_led_effect` with payload `{led: "<segment>", effect, color, level, duration}`.

Effect names differ from Red Series (e.g. `off solid open close small to big` etc. — see the node's help panel for the full list per mode) and are sent as their Zigbee2MQTT wire strings (e.g. `fast_blink`) rather than numbers. Color and Duration use the exact same encoding/parsing as Red Series. Brightness Level is natively 0-100 for Blue Series (not scaled through the 0-10 range used for Red Series). Clear Notification works the same way as Red Series (sends the `clear_effect` value).

## How to use

### Targets

Red Series only. Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Every target type is also configurable ad-hoc via its own payload field — `msg.payload.entity_id`, `msg.payload.device_id`, `msg.payload.area_id`, `msg.payload.floor_id`, `msg.payload.label_id` (each a single ID, a comma-delimited list, or a real array) — and each independently replaces only that target type's configured rows for that run, leaving the others untouched. Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Friendly Name(s)

Blue Series only. The Zigbee2MQTT friendly name(s) of the device(s) to notify — a single name, or a comma-delimited list. Also configurable ad-hoc via `msg.payload.friendly_name`.

### Switch Type

Specify your switch model — this also determines whether the node behaves as Red Series (Z-Wave/Action node) or Blue Series (Zigbee/MQTT). Also configurable by sending a message with the switch type in `msg.payload.switchtype`. Accepts the integer value of the effect parameter, or the switch model name (e.g. `lzw36`, `lzw31-sn`, `8`, `dimmer`, `switch`, `fan`, `lzw45`, `pixel effect`, `vzm31-sn`).

The LZW45 has two distinct modes, since it's the only switch with two different effect-style parameters:

- **Quick Effect** (parameter 21) — a temporary color/brightness/duration/effect overlay, same idea as every other switch's notification.
- **Pixel Effect** (parameter 31) — one of 45 built-in animations (Rainbow, Fireworks, Aurora, Chase variants, etc.) with just an effect choice and an intensity. It has no color, duration, or clear concept of its own, so those fields are hidden when this mode is selected.

### Segment

Blue Series only. 0 (default) targets the whole LED bar; 1-7 targets one individual segment. Also configurable via `msg.payload.segment`.

### Color

Choose a value between 0 and 361 to determine the hue of your notification. This node automatically converts that value to Inovelli's hue range (0-255), and also accepts RGB arrays (`255,0,0`), color names (`Red`), or hexadecimals (`#ff0000`) through `msg.payload.color`. Range: 0-361 (361 = white).

### Brightness Level

The brightness of your LED notification, also configurable through `msg.payload.brightness`. Range: 0-10 for Red Series (0-99 for the LZW45, scaled automatically). Range: 0-100 for Blue Series, sent through unscaled.

### Duration

The duration of your LED notification. The list provided in the node covers some generic values, but you can send several formats through `msg.payload.duration` to be more exact (e.g. `2 hours`, `4 days`, `47 seconds`). Range: 1-255.

### Effect Type

Based on your switch choice, choose between Off, Solid, Chase, Fast Blink, Slow Blink, Pulse, Fast Fade, or Slow Fade (the exact list depends on switch type — see the node's help panel). Also configurable through `msg.payload.effect`.

### Clear Notification

A checkbox to toggle clearing the current LED notification. When checked, this clears the current notification for the specified switch(es). Also configurable by setting `msg.payload.clear` to `true`.

### Multicast

Red Series only. A checkbox to toggle the use of multicast, sending the same value to multiple nodes simultaneously. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.

# Inovelli LED Manager

This node allows you to set the color and brightness of the LED indicator/strip (not notifications) on Inovelli switches without looking up parameter numbers manually. Supports both Red Series (Z-Wave) and Blue Series (Zigbee2MQTT).

<img width="501" height="786" alt="Screenshot 2026-08-02 at 03 19 33" src="https://github.com/user-attachments/assets/fcdb6049-9483-41aa-a45c-e1b35e65d819" />

## Blue Series

Covers VZM30-SN, VZM31-SN, VZM32-SN, and VZM35-SN (not VZM36 — it has no LED bar). Sets the LED bar's default (persistent) color/intensity when on/off — the global settings, not an individual segment:

- **Color** / **Color (Off)** → Zigbee2MQTT properties `ledColorWhenOn` / `ledColorWhenOff`.
- **Brightness** / **Brightness (Off)** → `ledIntensityWhenOn` / `ledIntensityWhenOff`.

Brightness is natively 0-100 for Blue Series (not the 0-10 range used for Red Series). VZM30-SN/VZM31-SN/VZM32-SN/VZM35-SN also support the LED bar's 7 individually-addressable segments via a **Segment** field (0 = the whole bar, 1-7 = that one segment; also configurable via `msg.payload.segment`) — VZM36 has a single, simpler status LED with no segments and no "off" color/brightness variant, so its Properties list is just Color/Brightness.

## How to use

### Targets

Red Series only. Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Every target type is also configurable ad-hoc via its own payload field — `msg.payload.entity_id`, `msg.payload.device_id`, `msg.payload.area_id`, `msg.payload.floor_id`, `msg.payload.label_id` (each a single ID, a comma-delimited list, or a real array) — and each independently replaces only that target type's configured rows for that run, leaving the others untouched. Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Friendly Name(s)

Blue Series only. The Zigbee2MQTT friendly name(s) of the device(s) to send this node's commands to — a single name, or a comma-delimited list. Also configurable ad-hoc via `msg.payload.friendly_name`.

### Switch Type

Specify your switch model (On/Off, Dimmer, Light Dimmer/Fan Dimmer/Fan & Light for the LZW36; VZM30-SN/VZM31-SN/VZM32-SN/VZM35-SN for Blue Series). Also configurable via `msg.payload.switchtype`. Note the LZW45 (Light Strip) isn't listed here — it has no separate "indicator" parameter distinct from its primary light output, so there's nothing for this node to configure on it; control its color/brightness the normal way via `light.turn_on`.

### Properties

Click **add** to add a property this node should set every time it runs — Color, Brightness, Brightness (When Off), and the Fan equivalents on the LZW36 (or, for Blue Series, Color (Off) instead of Fan equivalents) — the same "+ add a rule" pattern as Node-RED's core Switch/Change nodes. Add as many or as few as you want, in any order, and remove/reorder them the same way. Can't add the same property twice, and **add** disables itself once every property for the current switch type is already in the list.

- **Color** accepts color names, RGB arrays, hexadecimal, or 0-360 hue values (361 = white).
- **Brightness** values are 0-10 for Red Series, 0-100 for Blue Series.

Any property can also be sent ad-hoc via the payload even if it isn't in this node's configured list — e.g. sending `msg.payload.fanColor` will set the fan color on an LZW36 even if this node isn't configured to send it by default.

### Multicast

Red Series only. A checkbox to toggle the use of multicast. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.

# Inovelli Scene Manager

This node interprets scene data sent by multi-clicking a switch. For Red Series, connect it to a Home Assistant `events: all` node; for Blue Series, connect it to a core `mqtt in` node subscribed to a Zigbee2MQTT action topic (e.g. `zigbee2mqtt/+/action` for every device, or a specific device's topic); for White Series, connect it to the **same** `events: all` node Red Series uses (it recognizes the two shapes automatically). It automatically adds the appropriate number of outputs for triggering scenes.

<img width="503" height="476" alt="Screenshot 2026-08-02 at 03 20 16" src="https://github.com/user-attachments/assets/a6cc8d41-2f26-4c91-b02e-c27b2a3e1fd3" />

## Blue Series

Covers VZM30-SN, VZM31-SN, VZM32-SN, and VZM35-SN (not VZM36 — no paddle buttons). Zigbee2MQTT publishes button presses as a plain string to `zigbee2mqtt/<friendly name>/action` (e.g. `down_single`, `up_held`, `config_double`) rather than a Home Assistant event. This node recognizes that message shape automatically and matches `msg.payload` against the known action list, same idea as the Red Series button/scene lookup. The action vocabulary is 42 entries: `{down, up, config, aux_down, aux_up, aux_config}` × `{single, release, held, double, triple, quadruple, quintuple}` — the `aux_*` ones are for switches wired to an auxiliary/3-way paddle. In Single Output mode, the matched action string is also set on `msg.action` (alongside `msg.topic`), mirroring Red Series' `msg.button`/`msg.scene`.

## White Series

Covers VTM30-SN, VTM31-SN, and VTM35-SN (not VTM36 — no paddle buttons). This is architecturally different from the other two: Home Assistant's Matter integration exposes each physical button (Up paddle, Down paddle, Config button) as its **own separate `event.*` entity**, not as a sub-field of one shared message — "which button" is which entity fired, and "which click type" (`initial_press`, `long_press`, `multi_press_1`...`multi_press_N`, etc.) is that entity's own `event_type` attribute. Critically, **there's no reliable way to derive a button's entity_id automatically** — it varies by model/firmware and is fully user-renamable, which is why even Inovelli's own community tooling (the `jay-kub/inovelli-matter-switch-tap-sequences` Home Assistant blueprint) requires manually looking up each one. Look them up yourself the same way: **Settings > Devices & services > Matter > [your device] > Events > [Up/Down/Config] > gear icon > entity_id**, then map each to a role of your choosing in the **Button Entity IDs** list. Because the click-type vocabulary size varies per device (unlike Red/Blue Series' fixed lists), White Series switch types always behave in Single Output style — one output, with `msg.button` (the role you assigned) and `msg.action` (`<role>_<event type>`, e.g. `up_multi_press_2`) set on every match; the Single Output checkbox is hidden since it doesn't apply.

## How to use

### Node ID

Red Series only. The Node ID of the switch being used for scene control (or a comma-delimited list of Node IDs).

### Friendly Name(s)

Blue Series only. The Zigbee2MQTT friendly name(s) of the device(s) to accept scene events from — a single name, or a comma-delimited list.

### Button Entity IDs

White Series only. Click **add** to map one of your switch's button entity_ids (looked up in Home Assistant, see above) to a role name of your choosing (e.g. `up`, `down`, `config`) — add as many rows as you have buttons across as many switches as you like. An event from an entity_id not in this list is ignored unless Passthrough is enabled.

### Message Fields

Click **add** to set an arbitrary field directly on each matching message — give it a field name (e.g. `entity_id`, or anything else your downstream flow expects) and a value. Adding more than one row with the same field name combines their values into an array (e.g. two `entity_id` rows sets `msg.entity_id` to a 2-element array) instead of the last one silently overwriting the others; a name used only once stays a plain value. Useful for controlling dedicated smart bulbs from a scene trigger, or passing along any other context your flow needs. Unlike LED/Notification/Config Manager, this node doesn't call an HA action itself, so it isn't tied to Entity/Device/Area/Floor/Label targeting — it just sets whatever plain `msg` fields you configure.

### Switch Type

Specify your switch model: LZW30-SN, LZW31-SN, LZW36, or LZW45 for Red Series; VZM30-SN, VZM31-SN, VZM32-SN, or VZM35-SN for Blue Series; VTM30-SN, VTM31-SN, or VTM35-SN for White Series. This also determines which incoming message shape (HA Z-Wave event, Zigbee2MQTT action topic, or HA Matter button event) the node expects — a message that doesn't match the configured protocol is rejected with a clear error rather than silently misinterpreted.

### Node ID / Friendly Name Passthrough

Enable to process all scene messages received, regardless of Node ID, Friendly Name, or (White Series) configured Button Entity ID. Recommended only if your entire network is made up of the same switch type.

### Single Output

Red/Blue Series only (hidden for White Series, which always behaves this way). By default this node has one output per button/scene combination (e.g. 18 for the LZW36, 42 for any Blue Series model), so you wire each action directly. Enable Single Output to use a single output instead: the matched combination's index is set on `msg.topic` (the same index that would have picked a wire), and the raw matched values are set on `msg.button`/`msg.scene` (Red Series) or `msg.action` (Blue Series). Route with a `switch` node on `msg.topic` if you'd rather not manage that many wires.

# Inovelli Config Manager

This node sets miscellaneous configuration parameters that aren't LED indicator, notification, or scene related — the same "+add" property list as LED Manager, just for a different set of parameters. It supports both Red Series (Z-Wave) and Blue Series (Zigbee2MQTT) switches; which family a given node instance talks to is determined entirely by the selected Switch Type.

## Red Series

Deliberately limited to parameters that are each a single, whole Z-Wave parameter (no bitmask sub-fields, no firmware-version-dependent meaning):

- **Auto-Off Timer** (all four models) — how long before the switch automatically turns off. Accepts a number of seconds or a friendly string like `"10 minutes"` or `"2 hours"`. The LZW36 has a separate **Auto-Off Timer (Fan)** for its fan channel.
- **Power On State** (LZW30-SN only) — what the switch does after a power failure: Prior State, On, or Off.
- **State After Power Failure** (LZW45 only) — its own version of the above, with different options (Off, Default Color/Level, Previous State) since the light strip's power-failure behavior is about color/level, not on/off.
- **Local Protection** (LZW36 only) — disables local (physical) control of the light, fan, both, or neither.
- **Invert Switch** (LZW30-SN, LZW31-SN) — inverts the physical paddle/switch orientation.
- **LED Strip Timeout** (all but LZW45; separate **LED Strip Timeout (Fan)** on the LZW36) — how long the LED bar stays lit while being adjusted, in seconds.
- **Active Power Reports** / **Energy Reports** (all four models, Energy Reports on LZW30-SN and LZW36 only — see below) — the percentage change that triggers a new power/energy report.
- **Periodic Power & Energy Reports** (all four models) — how often a report is sent regardless of change, in seconds or a friendly duration string.
- **Load Type** (LZW30-SN only) — automatic or manual load type detection.
- **Instant On** (LZW30-SN, LZW36) — disables the 700ms button delay and multi-tap scenes when enabled.
- **Minimum/Maximum Level** (LZW31-SN, LZW36 light channel), **Minimum/Maximum Fan Level** (LZW36 only) — the dimming range floor/ceiling, as a percentage.
- **Light Brightness After Power Restored** / **Fan Speed After Power Restored** (LZW36 only) — what level the light/fan comes back to after a power failure.
- **Dimming Speed (Z-Wave / Manual)** and **Ramp Rate (Z-Wave / Manual)** (LZW31-SN, LZW36 light channel) — how fast the dimmer transitions, depending on whether the change came from Z-Wave or the physical paddle. Accepts a number of seconds or a friendly duration string; the maximum value for each is also that parameter's "immediate"/"synced with the other parameter" sentinel — check the device manual before relying on it.

Properties that exist on more than one model but need a "(Light)"/"(Fan)" clarification (like Auto-Off Timer and LED Strip Timeout on the LZW36, which has both) show that in their name automatically — you'll only see the plain name on a model that doesn't have the other half.

A few parameters are intentionally *not* unified across every model that has something similar, because the values genuinely differ in shape or meaning:

- **Association Behavior** and **Smart Bulb Mode** aren't supported at all yet — Association Behavior packs multiple named bits into one parameter on the LZW31-SN but has no documented bit breakdown on the LZW30-SN, and Smart Bulb Mode's value meaning changes across LZW31-SN firmware versions. Both need more careful per-model handling before being added.
- **Energy Reports** is excluded on the LZW31-SN (its units change with firmware — percentage before 1.43, 0.01 kWh from 1.43 on) and on the LZW45 (its 0-127 range doesn't match the plain 0-100% used everywhere else, a sign its units differ too).
- **Instant On** is only unified across the LZW30-SN/LZW36, which share identical wording and direction (Enabled=0/Disabled=1). The LZW31-SN's "Button Delay" and LZW45's "Disable Physical On/Off Delay" describe the same underlying feature but in the *opposite* direction (Disabled=0/Enabled=1), so they aren't included under this property yet.

<img width="503" height="786" alt="Screenshot 2026-08-02 at 03 21 24" src="https://github.com/user-attachments/assets/1d75b5fa-55ed-4712-83e9-1036b1c663e3" />

## Blue Series

Covers every model — **VZM30-SN** (On/Off), **VZM31-SN** (2-in-1 Switch/Dimmer), **VZM32-SN** (mmWave Dimmer), **VZM35-SN** (Fan Controller), **VZM36** (Fan Canopy Module, with separate light/fan endpoint properties) — via their Zigbee2MQTT property names directly (e.g. `switchType`, `smartBulbMode`, `ledColorWhenOn`), rather than numeric Z-Wave parameter numbers. The dropdown exposes every parameter confirmed for each model — dimming/ramp speed, min/max/default level, invert switch, switch type, smart bulb mode, button delay, double-tap behavior, individual LED bar segments (1-7), external fan binding, local protection, and (on the VZM32-SN) mmWave detection zone/sensitivity/room-size settings — with nothing held back to payload-only. Any property can still also be set ad-hoc via the payload using its Zigbee2MQTT property name, e.g. `msg.payload.defaultLed3ColorWhenOn`, even if it isn't in this node's configured Properties list.

## How to use

### Targets

Red Series only. Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Every target type is also configurable ad-hoc via its own payload field — `msg.payload.entity_id`, `msg.payload.device_id`, `msg.payload.area_id`, `msg.payload.floor_id`, `msg.payload.label_id` (each a single ID, a comma-delimited list, or a real array) — and each independently replaces only that target type's configured rows for that run, leaving the others untouched. Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Friendly Name(s)

Blue Series only. The Zigbee2MQTT friendly name(s) of the device(s) to send this node's commands to — a single name, or a comma-delimited list to send to multiple devices at once. Also configurable ad-hoc via `msg.payload.friendly_name`, which replaces the configured list for that run only. Since MQTT has no equivalent to a single Home Assistant service call fanning out to multiple devices, each targeted device/property combination is sent as its own `{topic, payload}` message, e.g. `zigbee2mqtt/Kitchen Dimmer/set/switchType` with payload `"3-Way Aux Switch"`.

### Switch Type

Specify your switch model — this also determines whether the node behaves as Red Series (Z-Wave/Action node) or Blue Series (Zigbee/MQTT). Also configurable via `msg.payload.switchtype`.

### Properties

Click **add** to add a parameter this node should set every time it runs, filtered to whichever parameters apply to the selected switch type. Can't add the same parameter twice, and **add** disables itself once every parameter for the current switch type is already in the list — same behavior as LED Manager.

### Multicast

Red Series only. A checkbox to toggle the use of multicast. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.
