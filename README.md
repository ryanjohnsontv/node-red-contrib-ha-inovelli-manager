# node-red-contrib-ha-inovelli-manager

Nodes for easily managing scenes, parameters, and notifications of Inovelli Red Series switches paired through Home Assistant's **Z-Wave JS** integration.

If you notice any problems please open an issue or a pull request, I'll respond ASAP. Feature requests are always welcome. Thanks!

These nodes should be used in conjunction with the [node-red-contrib-home-assistant-websocket](https://github.com/zachowj/node-red-contrib-home-assistant-websocket) palette, and the output should be connected to an **Action** node. This node will automatically fill in the appropriate `action`/`target`/`data` fields for that node. [Example flows are provided in this repo](https://github.com/ryanjohnsontv/node-red-contrib-ha-inovelli-manager/tree/main/examples).

## Features

- Four nodes: **Notification Manager**, **LED Manager**, **Scene Manager**, **Config Manager**
- Full support for every Inovelli Red Series module: **LZW30-SN** (On/Off), **LZW31-SN** (Dimmer), **LZW36** (Fan/Light), **LZW45** (Light Strip & Controller Kit)
- Multicast support
- Allows all fields to be controlled by the payload of an incoming message
- Uses the `color-convert` library to accept color names, RGB arrays, hexadecimals, or hue values as input
- Automatically converts input values to the proper format (e.g. inputting "2 Hours" converts to 168 for Inovelli math)
- Easily clear notifications

> **Upgrading from a pre-1.0 version?** This package now targets Z-Wave JS exclusively — OpenZWave and the legacy `zwave` integration are no longer supported (both have been gone from Home Assistant for years, and this project assumed everyone had already migrated). Existing flows keep working with no changes required: switch-type values weren't renumbered, and the LED Manager node automatically converts its old fixed color/brightness fields into the new properties list (see below) the first time it runs or the first time you reopen it in the editor.
>
> **Upgrading from an older 0.3.1 or earlier version?** Two more changes, both automatic and non-breaking:
>
> - Every node's output now sends `{action, target, data}` (the format node-red-contrib-home-assistant-websocket's modern **Action** node expects) instead of the older `{domain, service, data}`. If your flow's next node is an Action node, nothing changes for you. If you're still using the deprecated `api-call-service` node with the old field names, switch that node to Action (or point it at the same fields under the new shape).
> - The plain "Entity ID(s)" text field on LED/Notification/Config Manager has been replaced by a **Targets** picker supporting Entity, Device, Area, Floor, and Label — matching the Action node's own Targets UI. Scene Manager also has a Targets picker now, though it works a little differently (see its section below). Existing `entityid` values are migrated into the new Targets list automatically the first time each node runs; re-open and save the node in the editor to persist the new format (a one-time `node.warn()` will remind you if this happened).

# Inovelli Notification Manager

Forked from the exceptionally wonderful https://github.com/pdong/node-contrib-inovelli-status-manager repo.

This node allows you to set color, brightness, and effect type/duration for notifications on Inovelli Red Series switches. No manual calculations needed!

![image](https://user-images.githubusercontent.com/43426700/114622017-0f7db200-9c73-11eb-8c48-1fd31c3b8141.png)

## How to use

### Targets

Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Entity targets are also configurable ad-hoc via `msg.payload.entity_id` (a single ID or a comma-delimited list), which replaces any Entity targets configured here for that run only — Device/Area/Floor/Label targets are unaffected. Flows saved before this picker existed had a single "Entity ID(s)" text field; those are migrated automatically (see the upgrade note above). Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Switch Type

Specify your switch model. Also configurable by sending a message with the switch type in `msg.payload.switchtype`. Accepts the integer value of the effect parameter, or the switch model name (e.g. `lzw36`, `lzw31-sn`, `8`, `dimmer`, `switch`, `fan`, `lzw45`, `pixel effect`).

The LZW45 has two distinct modes, since it's the only switch with two different effect-style parameters:

- **Quick Effect** (parameter 21) — a temporary color/brightness/duration/effect overlay, same idea as every other switch's notification.
- **Pixel Effect** (parameter 31) — one of 45 built-in animations (Rainbow, Fireworks, Aurora, Chase variants, etc.) with just an effect choice and an intensity. It has no color, duration, or clear concept of its own, so those fields are hidden when this mode is selected.

### Color

Choose a value between 0 and 361 to determine the hue of your notification. This node automatically converts that value to Inovelli's hue range (0-255), and also accepts RGB arrays (`255,0,0`), color names (`Red`), or hexadecimals (`#ff0000`) through `msg.payload.color`. Range: 0-361 (361 = white).

### Brightness Level

The brightness of your LED notification, also configurable through `msg.payload.brightness`. Range: 0-10. For the LZW45 (which natively uses a 0-99 intensity scale) this is automatically scaled up (`brightness * 10`, capped at 99).

### Duration

The duration of your LED notification. The list provided in the node covers some generic values, but you can send several formats through `msg.payload.duration` to be more exact (e.g. `2 hours`, `4 days`, `47 seconds`). Range: 1-255.

### Effect Type

Based on your switch choice, choose between Off, Solid, Chase, Fast Blink, Slow Blink, Pulse, Fast Fade, or Slow Fade (the exact list depends on switch type — see the node's help panel). Also configurable through `msg.payload.effect`.

### Clear Notification

A checkbox to toggle clearing the current LED notification. When checked, this clears the current notification for the specified switch(es). Also configurable by setting `msg.payload.clear` to `true`.

### Multicast

A checkbox to toggle the use of multicast, sending the same value to multiple nodes simultaneously. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.

# Inovelli LED Manager

This node allows you to set the color and brightness of the LED indicator/strip (not notifications) on Inovelli Red Series switches without looking up parameter numbers manually.

![image](https://user-images.githubusercontent.com/43426700/114769932-78772f80-9d30-11eb-86be-106dc2de4383.png)

## How to use

### Targets

Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Entity targets are also configurable ad-hoc via `msg.payload.entity_id` (a single ID or a comma-delimited list), which replaces any Entity targets configured here for that run only — Device/Area/Floor/Label targets are unaffected. Flows saved before this picker existed had a single "Entity ID(s)" text field; those are migrated automatically (see the upgrade note above). Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Switch Type

Specify your switch model (On/Off, Dimmer, Light Dimmer/Fan Dimmer/Fan & Light for the LZW36). Also configurable via `msg.payload.switchtype`. Note the LZW45 (Light Strip) isn't listed here — it has no separate "indicator" parameter distinct from its primary light output, so there's nothing for this node to configure on it; control its color/brightness the normal way via `light.turn_on`.

### Properties

Click **add** to add a property this node should set every time it runs — Color, Brightness, Brightness (When Off), and the Fan equivalents on the LZW36 — the same "+ add a rule" pattern as Node-RED's core Switch/Change nodes. Add as many or as few as you want, in any order, and remove/reorder them the same way. Can't add the same property twice, and **add** disables itself once every property for the current switch type is already in the list.

- **Color** accepts color names, RGB arrays, hexadecimal, or 0-360 hue values (361 = white).
- **Brightness** values are 0-10.

Any property can also be sent ad-hoc via the payload even if it isn't in this node's configured list — e.g. sending `msg.payload.fanColor` will set the fan color on an LZW36 even if this node isn't configured to send it by default.

### Multicast

A checkbox to toggle the use of multicast. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.

# Inovelli Scene Manager

This node interprets scene data sent by multi-clicking a Red Series switch. Connect it to a Home Assistant `events: all` node; it automatically adds the appropriate number of outputs for triggering scenes.

![image](https://user-images.githubusercontent.com/43426700/114770466-1965ea80-9d31-11eb-92f7-8fec410095c1.png)

## How to use

### Node ID

The Node ID of the switch being used for scene control (or a comma-delimited list of Node IDs).

### Message Fields

Click **add** to set an arbitrary field directly on each matching message — give it a field name (e.g. `entity_id`, or anything else your downstream flow expects) and a value. Adding more than one row with the same field name combines their values into an array (e.g. two `entity_id` rows sets `msg.entity_id` to a 2-element array) instead of the last one silently overwriting the others; a name used only once stays a plain value. Useful for controlling dedicated smart bulbs from a scene trigger, or passing along any other context your flow needs. Unlike LED/Notification/Config Manager, this node doesn't call an HA action itself, so it isn't tied to Entity/Device/Area/Floor/Label targeting — it just sets whatever plain `msg` fields you configure. Flows saved before this list existed had a single "Entity ID(s)" text field that just set `msg.entity_id`; that's migrated automatically into an equivalent field (see the upgrade note above).

### Switch Type

Specify your switch model: LZW30-SN, LZW31-SN, LZW36, or LZW45.

### Node ID Passthrough

Enable to process all scene messages received, regardless of Node ID. Recommended only if your entire Z-Wave network is made up of the same switch type.

### Single Output

By default this node has one output per button/scene combination (e.g. 18 for the LZW36), so you wire each action directly. Enable Single Output to use a single output instead: the matched combination's index is set on `msg.topic` (the same index that would have picked a wire), and the raw matched values are set on `msg.button`/`msg.scene`. Route with a `switch` node on `msg.topic` if you'd rather not manage that many wires.

# Inovelli Config Manager

This node sets miscellaneous configuration parameters that aren't LED indicator, notification, or scene related — the same "+add" property list as LED Manager, just for a different set of parameters.

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

## How to use

### Targets

Click **add** to add an Entity, Device, Area, Floor, or Label to set the configuration parameter on — the same Targets picker as the Home Assistant Action node. Add as many rows of any type/combination as needed. Entity targets are also configurable ad-hoc via `msg.payload.entity_id` (a single ID or a comma-delimited list), which replaces any Entity targets configured here for that run only — Device/Area/Floor/Label targets are unaffected. Flows saved before this picker existed had a single "Entity ID(s)" text field; those are migrated automatically (see the upgrade note above). Any configured Entity targets are also set on a top-level `msg.entity_id` (in addition to `msg.payload.target.entity_id`), for downstream Action nodes whose own Target field is configured to read directly from `msg.entity_id`.

### Switch Type

Specify your switch model. Also configurable via `msg.payload.switchtype`.

### Properties

Click **add** to add a parameter this node should set every time it runs, filtered to whichever parameters apply to the selected switch type. Can't add the same parameter twice, and **add** disables itself once every parameter for the current switch type is already in the list — same behavior as LED Manager.

### Multicast

A checkbox to toggle the use of multicast. Requires additional Z-Wave JS configuration (see [multicast/](multicast/)). Also configurable by setting `msg.payload.multicast` to `true`.
