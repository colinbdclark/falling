(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");    

    flock.init({
        bufferSize: 128,
        rates: {
            audio: 22050
        }
    });
          
    fluid.defaults("colin.veryVery.movementResponder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            synth: {
                type: "flock.synth",
                options: {
                    synthDef: {
                        id: "carrier",
                        ugen: "flock.ugen.sinOsc",
                        freq: 220,
                        mul: 0.5
                    }
                }
            },
            
            motionSource: {
                type: "colin.veryVery.motionSource.udp",
                options: {
                    listeners: {
                        onMotion: {
                            funcName: "{synth}.set",
                            args: ["carrier.freq", "{arguments}.0"]
                        }
                    }
                }
            }
        },
        
        listeners: {
            onCreate: [
                /*{
                    funcName: "flock.init",
                    args: ["{that}.options.audioEnvironment"]
                },*/
                {
                    funcName: "{that}.synth.play"
                }
            ]
        }
    });
    
    
    fluid.defaults("colin.veryVery.motionSource.udp", {
        gradeNames: ["fluid.eventedComponent", "fluid.modelComponent", "autoInit"],
        
        components: {
            udpServer: {
                type: "colin.udpServer",
                options: {
                    listeners: {
                        onListening: {
                            funcName: "{synth}.play"
                        },
                        
                        onMessage: {
                            funcName: "colin.veryVery.motionSource.udp.scaleValue",
                            args: ["{arguments}.0", "{arguments}.1", "{that}.events.onMotion.fire"]
                        }
                    }
                }
            }
        },
        
        events: {
            onMotion: null
        }
    });
    
    colin.veryVery.motionSource.udp.scaleValue = function (rawMotionMessage, onMotion) {
        var value = rawMotionMessage.readFloat32LE(0);
        value = (value * 11025) + 60;
        
        console.log("Received synth value:", value);
        onMotion(value);
    };
    
}());
