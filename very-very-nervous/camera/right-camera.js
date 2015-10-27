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
            device: "/dev/video1",
            filename: "images/right/very-very-snapshot.pgm"
        },

        port: 65532,

        distributeOptions: {
            source: "{that}.options.port",
            target: "{that client}.options.port"
        }
    });

    snapshotter.snap();
    
}());
