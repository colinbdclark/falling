(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");

    loader.require("./lou-synths.js");
    
    fluid.defaults("colin.lou.movementResponder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        motionValueUGenNames: {
            left: {
                drumClock: ["motion"],
                pianoGuitar: ["pianoStart", "pianoEnd"]
            },
            right: {
                drumBass: ["motion"]
            }
        },
        
        components: {
            instrument: {
                type: "colin.lou",
                options: {
                    listeners: {
                        onCreate: {
                            funcName: "colin.lou.setupMotionValueUGens",
                            args: ["{movementResponder}.options.motionValueUGenNames", "{that}"]
                        }
                    }
                }
            },
            
            conductorSource: {
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
                    port: 65534,
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
    
    colin.lou.setupMotionValueUGens = function (motionValueUGenNames, instrument) {
        var motionValueUGens = {
            left: [],
            right: []
        };
        
        fluid.each(motionValueUGenNames, function (ugenNameSpec, channel) {
            fluid.each(ugenNameSpec, function (ugenNames, synthName) {
                var synth = instrument[synthName];
                if (!synth) {
                    return;
                }
            
                fluid.each(ugenNames, function (ugenName) {
                    motionValueUGens[channel].push(synth.namedNodes[ugenName]);
                });
            
                console.log("Tracking " + channel + "-side motion with ugens", ugenNames, "on synth named", synthName);
            });
        });

        
        instrument.motionValueUGens = motionValueUGens;
    };
    
    colin.lou.mapMotionToSynth = function (instrument, rawMotionMessage, remoteInfo) {
        var leftValue = rawMotionMessage.readFloatLE(0),
            rightValue = rawMotionMessage.readFloatLE(4),
            motionValueUGens = instrument.motionValueUGens,
            leftUGens = motionValueUGens.left,
            rightUGens = motionValueUGens.right,
            i,
            ugen;
        
        console.log("Recieved raw values:", leftValue, rightValue);
        
        for (i = 0; i < leftUGens.length; i++) {
            ugen = leftUGens[i];
            ugen.model.value = leftValue;
        }
        
        for (i = 0; i < rightUGens.length; i++) {
            ugen = rightUGens[i];
            ugen.model.value = rightValue;
        }
    };
}());
