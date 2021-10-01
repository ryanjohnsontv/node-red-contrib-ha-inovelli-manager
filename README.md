# node-red-contrib-ha-inovelli-manager
Nodes for easily managing scenes, parameters, and notifications of Inovelli switches paired through various Home Assistant integrations

If you notice any problems please open an issue or a pull request, I'll respond ASAP. Feature requests are always welcome. Thanks!

These nodes should be used in conjunction with the node-red–contrib-home-assistant-websocket plaette, and the output should
be connected to an api-call-service node. This node will automatically fill in the appropriate fields for that node. [Example flows are provided in this repo](https://github.com/ryanjohnsontv/node-red-contrib-inovelli-notification-calculator/tree/main/examples).

## Features:
-   Multicast Support
-   Support for OpenZWave, Z-Wave (deprectaed), and Z-Wave JS (Requires Home Assistant 2021.4.0 or newer)
-   Allows all fields to be controlled by the payload of an incoming message
-   Use color-convert library to accept color names, RGB arrays, hexadecimals, or hue value as input
-   (For notifications) Automatically convert input values to proper format (ie. inputting "2 Hours" converts to 168 for Inovelli math)
-   Detect color input to properly convert to Inovelli's hue range
-   Support for ALL Inovelli switches
-   Easily clear notifications

# Inovelli Notification Manager

Forked from the exceptionally wonderful https://github.com/pdong/node-contrib-inovelli-status-manager repo.

This node allows you to easily set the appropriate values to send to your Inovelli Red Series switches.


![image](https://user-images.githubusercontent.com/43426700/114622017-0f7db200-9c73-11eb-8c48-1fd31c3b8141.png)


## How to use:

### Z-Wave Integration

You are able to choose between Z-Wave JS, OpenZWave, or Z-Wave (deprecated) as your integration. This can also be set via msg.payload.zwave (values: zwave_js, ozw, or zwave).

### Entity ID/Node ID

Depending on your Z-Wave integration, you'll have the option to add one ID, or a comma delimited list of IDs. For Z-Wave JS you can set this entity ID in the Home Assistant call-service node, in this node, or send a message with your ID(s) in the msg.payload.entity_id field. For OZW you can set the ID(s) in this node or send a messages with your ID(s) in the msg.payload.node_id field.

### Switch Type

This option lets you specify your switch model, and can also be configured by sending a message with the switch type in the msg.payload.switchtype field. This accepts the integer value of the effect paramter(s), and also the switch model (eg. lzw36, LZW31-sn, 8, dimmer, switch, fan).

### Color

Choose a value between 0 and 360 to determine the hue of your notification. This node will automatically convert that value to Inovelli's hue range (0-255), and it also accepts RGB arrays (255,0,0), color names (Red), or hexadecimals (#ff0000) through msg.payload.color. Range: 0-360

### Brightness Level

The brightness of your LED Notification, also configurable through msg.payload.brightness. Range: 0-10

### Duration

The duration of your LED Notification. The list provided in the node are some generic values, however you can send several format through msg.payload.duration to be more exact (eg. 2 hours, 4 days, 47 seconds). Range: 1-255.

### Effect Type

Based on your switch choice, choose between Off, Solid, Chase, Fast Blink, Slow Blink, or Pulse. Also configurable through msg.payload.effect.

### Clear Notification

A checkbox to toggle clearing the the current LED Notification, when checked this will clear the current notification for your specified switch. Also configurable by setting msg.payload.clear to a boolean value of true or false.

### Use Multicast

A checkbox to toggle the use of multicast, or sending the same value to multiple nodes simultaneously. Requires additional Z-Wave JS configuration.


# Inovelli LED Manager

This node allows you to easily set the appropriate color and brightness values for Red & Black series switches when they're on or off.

![image](https://user-images.githubusercontent.com/43426700/114769932-78772f80-9d30-11eb-86be-106dc2de4383.png)

## How to use:

### Z-Wave Integration

You are able to choose between Z-Wave JS, OpenZWave, or Z-Wave (deprecated) as your integration. This can also be set via msg.payload.zwave (values: zwave_js, ozw, or zwave).

### Entity ID/Node ID

Depending on your Z-Wave integration, you'll have the option to add one ID, or a comma delimited list of IDs. For Z-Wave JS you can set this entity ID in the Home Assistant call-service node, in this node, or send a message with your ID(s) in the msg.payload.entity_id field. For OZW you can set the ID(s) in this node or send a messages with your ID(s) in the msg.payload.node_id field.

### Switch Type

This option lets you specify your switch model, and can also be configured by sending a message with the switch type in the msg.payload.switchtype field. This accepts the integer value of the effect paramter(s), and also the switch model (eg. lzw36, LZW31-sn, 8, dimmer, switch, fan).

### Color

Choose a value between 0 and 360 to determine the hue of your notification. This node will automatically convert that value to Inovelli's hue range (0-255), and it also accepts RGB arrays (255,0,0), color names (Red), or hexadecimals (#ff0000). Can be set through msg.payload.lightColor (or msg.payload.fanColor for LZW-36). Range: 0-360

### Brightness Level (When On)

The brightness of your LED bar when the relay is on. Also configurable through msg.payload.lightBrightness (or msg.payload.fanBrightness for LZW-36). Range: 0-10

### Brightness Level (When Off)

The brightness of your LED bar when the relay is off. Also configurable through msg.payload.lightBrightnessOff (or msg.payload.fanBrightnessOff for LZW-36). Range: 0-10

### Use Multicast

A checkbox to toggle the use of multicast, or sending the same value to multiple nodes simultaneously. Requires additional Z-Wave JS configuration.


# Inovelli Scene Manager

This node interepts scenes sent by multi-clicking on a Red series switch. Connect to a Home Assistant events-all, node adds appropriate number of outputs for triggering scenes.

![image](https://user-images.githubusercontent.com/43426700/114770466-1965ea80-9d31-11eb-92f7-8fec410095c1.png)

## How to use:

### Z-Wave Integration

You are able to choose between Z-Wave JS or OpenZWave as your integration.

### Node ID

The Node ID of the switch being used for scene control

### Switch Type

This option lets you specify your switch model (LZW30-SN, LZW31-SN, LZW36, and LZW45).
