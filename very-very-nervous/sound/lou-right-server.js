(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("../shared/net.js");
    loader.require("./lou-movementResponder.js");
    
    var movementResponder = colin.lou.movementResponder({
        components: {    
            drumClock: {
                type: "colin.lou.synths.drumClock"
            },
            
            drumBass: {
                type: "colin.lou.synths.drumBass"
            }
        }
    });
    
}());
