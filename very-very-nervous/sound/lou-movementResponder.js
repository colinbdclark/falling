(function () {
    "use strict";

    var fluid = require("infusion"),
        loader = fluid.getLoader(__dirname),
        colin = fluid.registerNamespace("colin");

    loader.require("./lou-synths.js");
    
    fluid.defaults("colin.lou.movementResponder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        motionValueUGenNames: {
            drumBass: ["motion"],
            pianoGuitar: ["pianoStart", "pianoEnd"]
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
        var motionValueUGens = [];
        fluid.each(motionValueUGenNames, function (ugenNames, synthName) {
            var synth = instrument[synthName];
            if (!synth) {
                return;
            }
            
            fluid.each(ugenNames, function (ugenName) {
                motionValueUGens.push(synth.namedNodes[ugenName]);
            });
            
            console.log("Tracking motion with ugens", ugenNames, "on synth named", synthName);
        });
        
        instrument.motionValueUGens = motionValueUGens;
    };
    
    colin.lou.mapMotionToSynth = function (instrument, rawMotionMessage, remoteInfo) {
        var value = rawMotionMessage.readFloatLE(0),
            motionValueUGens = instrument.motionValueUGens,
            i,
            ugen;
        
        console.log("Raw value:", value);
        for (i = 0; i < motionValueUGens.length; i++) {
            ugen = motionValueUGens[i];
            ugen.model.value = value;
        }
    };
}());
