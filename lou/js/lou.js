(function () {
    "use strict";
    
    fluid.registerNamespace("colin");
    
    flock.init({
        numBuses: 6
    });
    
    fluid.defaults("colin.lou", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            // TODO: Make these dynamic components or bind them directly in the synths.
            pianoClock: {
                type: "colin.lou.synths.pianoClock"
            },
            
            guitarClock: {
                type: "colin.lou.synths.guitarClock"
            },
            
            drumClock: {
                type: "colin.lou.synths.drumClock"
            },
            //
            
            drumBass: {
                type: "colin.lou.synths.drumBass"
            },
            
            pianoGuitar: {
                type: "colin.lou.synths.pianoGuitar"
            }
        },
        
        listeners: {
            onCreate: {
                funcName: "flock.enviro.shared.play"
            }
        }
    });
    
    
    fluid.registerNamespace("colin.lou.synths");
    
    fluid.defaults("colin.lou.synths.clock", {
        gradeNames: ["flock.synth"],

        bpm: 104,
        
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
                    url: "audio/44100/tom-44100.wav"
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
                    url: "audio/44100/dsharp-piano-44100.wav"
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
                    url: "audio/44100/csharp-guitar-44100.wav"
                }
            }
        ]
    });
}());
