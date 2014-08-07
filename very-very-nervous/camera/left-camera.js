(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("../shared/net.js");
    loader.require("./movementDetectors.js");
    loader.require("./snapshotter.js");

    var snapshotter = colin.veryVery.snapshotter.cmd({
        imageDef: {
            device: "/dev/video0",
            filename: "images/left/very-very-snapshot.pgm"
        },
        
        port: 65534,

        distributeOptions: {
            source: "{that}.options.port",
            target: "{that client}.options.port"
        }
    });
    snapshotter.snap();
    
}());
