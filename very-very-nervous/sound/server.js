(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");    

    loader.require("../shared/udp.js");
    loader.require("./movementResponder.js");

    var movementResponder = colin.veryVery.movementResponder();
    
}());
