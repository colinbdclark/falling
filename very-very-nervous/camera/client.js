(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("./udpClient.js");
    loader.require("./movementDetectors.js");
    loader.require("./snapshotter.js");

    var snapshotter = colin.veryVery.snapshotter.cmd();
    snapshotter.snap();
    
}());
