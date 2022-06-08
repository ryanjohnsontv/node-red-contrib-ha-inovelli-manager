# Instant Notifications - Multicast Method
This requires a bit more setup but replaces the service zwave_js.bulk_set_parameters with the faster zwave_js.multicast_set_value alternative. Requires relevant nodes to be on the same Z-Wave network with the same security level.

## How To Use:

[Pulled directly from this Inovelli forum post](https://community.inovelli.com/t/instant-notifications-all-switches-using-multicast-on-ha/9077/29)

1. In zwavejs2mqtt, under store tab create a config under the root store folder

2. Copy the corresponding JSON in this folder to the config folder, including master_template.json (store/config/*.json)
![image](https://community.inovelli.com/uploads/default/original/2X/d/db4293b422a6744f0b68873280cf99eaeb0681fb.png)

3. Restart zwavejs2mqtt and re-interview the nodes, and if it worked you'll now see a "Bulk set Param _" (8 for on/off, 16 for dimmer, 24 & 25 for fan/light combo)

4. Update your respective nodes to use the new multicast option