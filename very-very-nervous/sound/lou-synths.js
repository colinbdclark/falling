(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");

    flock.init({
        bufferSize: 128,
        numBuses: 6,
        rates: {
            audio: 22050
        }
    });
    
    fluid.registerNamespace("colin.lou");
    
    fluid.defaults("colin.lou.instrument", {
        gradeNames: ["fluid.eventedComponent"],
        
        invokers: {
            play: {
                funcName: "flock.enviro.shared.play"
            },
            
            stop: {
                funcName: "flock.enviro.shared.stop"
            }
        }
    });
    
    fluid.defaults("colin.lou.instrument.all", {
        gradeNames: ["colin.lou.instrument", "autoInit"],
        
        components: {
            pianoClock: {
                type: "colin.lou.synths.pianoClock"
            },
            
            guitarClock: {
                type: "colin.lou.synths.guitarClock"
            },
            
            drumClock: {
                type: "colin.lou.synths.drumClock"
            },
            
            drumBass: {
                type: "colin.lou.synths.drumBass"
            },
            
            pianoGuitar: {
                type: "colin.lou.synths.pianoGuitar"
            }
        }
    });
    
    fluid.defaults("colin.lou.instrument.left", {
        gradeNames: ["colin.lou.instrument", "autoInit"],
        
        components: {
            drumClock: {
                type: "colin.lou.synths.drumClock"
            },
            
            drumBass: {
                type: "colin.lou.synths.drumBass"
            }
        }
    });
    
    fluid.defaults("colin.lou.instrument.right", {
        gradeNames: ["colin.lou.instrument", "autoInit"],
        
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
    
    
    fluid.registerNamespace("colin.lou.synths");
    
    fluid.defaults("colin.lou.synths.clock", {
        gradeNames: ["flock.synth"],

        bpm: 52,
        
        synthDef: {
            ugen: "flock.ugen.out",
            expand: 1,
            sources: {
                ugen: "flock.ugen.impulse",
                rate: "control",
                freq: {
                    expander: {
                        funcName: "colin.lou.synths.convertBeatsToFreq",
                        args: ["{that}.options.pulse", "{that}.options.bpm"]
                    }
                }
            }
        }
    });
    
    colin.lou.synths.convertBeatsToFreq = function (beats, bpm) {
        return (bpm / beats) / 60;
    };
    
    fluid.defaults("colin.lou.synths.pianoClock", {
        gradeNames: ["colin.lou.synths.clock", "autoInit"],
        
        pulse: 1.25,
        
        synthDef: {
            bus: 2
        }
    });
    
    fluid.defaults("colin.lou.synths.guitarClock", {
        gradeNames: ["colin.lou.synths.clock", "autoInit"],
        
        pulse: 1.5,
        
        synthDef: {
            bus: 3
        }
    });
    
    fluid.defaults("colin.lou.synths.drumClock", {
        gradeNames: ["colin.lou.synths.clock", "autoInit"],
        
        pulse: 1,
        
        synthDef: {
            bus: 4
        }
    });
    
    fluid.defaults("colin.lou.synths.drumBass", {
        gradeNames: ["flock.synth", "autoInit"],
        
        synthDef: [            
            // Drum
            {
                ugen: "flock.ugen.playBuffer",
                mul: 0.5,
                trigger: {
                    id: "drumTrigger",
                    ugen: "flock.ugen.in",
                    bus: 4
                },
                buffer: {
                    id: "tom",
                    url: "../lou/audio/22050/tom-22050.wav"
                }
            },
            
            // Bass
            {
                ugen: "flock.ugen.sinOsc",
                freq: 146 * (2 /3),
                mul: 0.12
            },
        ]
    });
    
    fluid.defaults("colin.lou.synths.pianoGuitar", {
        gradeNames: ["flock.synth", "autoInit"],
        
        synthDef: [
            // Piano
            {
                ugen: "flock.ugen.playBuffer",
                mul: 0.25,
                trigger: {
                    id: "pianoTrigger",
                    ugen: "flock.ugen.in",
                    bus: 2
                },
                buffer: {
                    id: "dsharp-piano",
                    url: "../lou/audio/22050/dsharp-piano-22050.wav"
                }
            },
            
            // Guitar
            {
                ugen: "flock.ugen.playBuffer",
                mul: 0.5,
                trigger: {
                    id: "guitarTrigger",
                    ugen: "flock.ugen.in",
                    bus: 3
                },
                buffer: {
                    id: "csharp-guitar",
                    url: "../lou/audio/22050/csharp-guitar-22050.wav"
                }
            }
        ]
    });

}());
