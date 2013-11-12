(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("../shared/net.js");
    loader.require("./lou-movementResponder.js");
    
    var movementResponder = colin.lou.movementResponder({
        components: {
            pianoClock: {
                type: "colin.lou.synths.pianoClock"
            },
            
            guitarClock: {
                type: "colin.lou.synths.guitarClock"
            },
            
            pianoGuitar: {
                type: "colin.lou.synths.pianoGuitar"
            }
        }
    });
    
}());
