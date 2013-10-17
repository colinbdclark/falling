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
                type: "colin.veryVery.motionSource.server",
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
    
    
    fluid.defaults("colin.veryVery.motionSource.server", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            server: {
                type: "colin.tcpServer"
            }
            /*udpServer: {
                type: "colin.udpServer",
                options: {
                    listeners: {
                        onListening: {
                            funcName: "{synth}.play"
                        },
                        
                        onMessage: {
                            funcName: "colin.veryVery.motionSource.server.scaleValue",
                            args: ["{arguments}.0", "{arguments}.1", "{udp}.events.onMotion.fire"]
                        }
                    }
                }
            }*/
        },
        
        events: {
            onMotion: null
        }
    });
    
    colin.veryVery.motionSource.server.scaleValue = function (rawMotionMessage, remoteInfo, onMotion) {
        var value = rawMotionMessage.readFloatLE(0);
        value = (value * 11025) + 60;
        
        console.log("Received synth value:", value);
        onMotion(value);
    };
    
}());
