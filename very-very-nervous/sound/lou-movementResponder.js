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
            
            conductor: {
                type: "colin.udpServer",
                
                options: {
                    port: 65533,
                    listeners: {
                        onMessage: {
                            funcName: "colin.lou.start",
                            args: ["{instrument}", "{arguments}.0"]
                        }
                    }
                }
            },
            
            motionSource: {
                type: "colin.udpServer",
                
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
    });
    
    colin.lou.start = function (instrument, rawMessage) {
        var conductorSignal = rawMessage.readFloatLE(0);
        
        if (conductorSignal === 1.0) {
            instrument.play();
        } else if (conductorSignal === 0.0) {
            instrument.stop();
        }
    };
    
    colin.lou.mapMotionToSynth = function (louInstrument, rawMotionMessage, remoteInfo) {
        var value = rawMotionMessage.readFloatLE(0);
        console.log("Raw value:", value);
    };
}());
