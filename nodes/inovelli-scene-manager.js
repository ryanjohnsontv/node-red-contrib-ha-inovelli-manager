module.exports = function (RED) {
  function InovelliSceneManager(config) {
    RED.nodes.createNode(this, config);
    var node = this;
    const {
      zwave,
      entityid,
      nodeid,
      switchtype,
      outputs,
    } = config;

    this.zwave = zwave;
    this.entityid = entityid;
    this.nodeid = parseInt(nodeid, 10);
    this.switchtype = parseInt(switchtype, 10);
    this.outputs = parseInt(outputs, 10);

    node.on("input", (msg) => {
      const {
        zwave,
        entityid,
        nodeid,
        switchtype,
        outputs
      } = node;
      const { payload } = msg;
    });
  }
  RED.nodes.registerType(
    "inovelli-scene-manager",
    InovelliSceneManager
  );
};
