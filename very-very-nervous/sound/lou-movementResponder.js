(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");

    loader.require("./lou-synths.js");
    
    fluid.defaults("colin.lou.movementResponder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            instrument: {
                type: "colin.lou"
            },
            
            motionSource: {
                type: "colin.lou.motionSource.net",
                options: {
                    components: {
                        server: {
                            options: {
                                listeners: {
                                    onMessage: {
                                        funcName: "colin.lou.mapMotionToSynth",
                                        args: ["{instrument}", "{arguments}.0", "{arguments}.1"]
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        
        events: {
            onBuffersLoaded: null
        }
    });
    
    
    fluid.defaults("colin.lou.motionSource.net", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            server: {
                type: "colin.udpServer"
            }
        }
    });
    
    colin.lou.mapMotionToSynth = function (louInstrument, rawMotionMessage, remoteInfo) {
        var value = rawMotionMessage.readFloatLE(0);
        console.log("Raw value:", value);
    };
}());
