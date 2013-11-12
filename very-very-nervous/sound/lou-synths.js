(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");

    flock.init({
        bufferSize: 128,
        numBuses: 3,
        rates: {
            audio: 22050
        }
    });
    
    fluid.defaults("colin.lou", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],
        
        components: {
            bass: {
                type: "colin.lou.bass"
            },
            piano: {
                type: "colin.lou.piano"
            },
            guitar: {
                type: "colin.lou.guitar"
            },
            drums: {
                type: "colin.lou.drums"
            },
            clock: {
                type: "flock.scheduler.async.tempo",
                options: {
                    bpm: 104,
                    listeners: {
                        onCreate: [
                            {
                                funcName: "colin.lou.scheduleAttacks",
                                args: ["{lou}.clock", "{lou}.options.schedule"]
                            },
                            {
                                funcName: "flock.enviro.shared.play"
                            }
                        ]
                    }
                }
            }
        },
        
        schedule: [
            {
                interval: "repeat",
                time: 1, // bpm
                change: {
                    synth: "drums",
                    values: {
                        "trigger.source": 1.0
                    }
                }
            },
            {
                interval: "repeat",
                time: 1.25, // bpm
                change: {
                    synth: "piano",
                    values: {
                        "trigger.source": 1.0
                    }
                }
            },
            {
                interval: "repeat",
                time: 1.5, // bpm
                change: {
                    synth: "guitar",
                    values: {
                        "trigger.source": 1.0
                    }
                }
            }
        ]
    });
    
    colin.lou.scheduleAttacks = function (scheduler, schedule) {
        scheduler.schedule(schedule);
    };
    
    fluid.defaults("colin.lou.bass", {
        gradeNames: ["flock.synth", "autoInit"],
    
        synthDef: {
            ugen: "flock.ugen.sinOsc",
            freq: 146 * (2 /3),
            mul: 0.12
        }
    });

    fluid.defaults("colin.lou.piano", {
        gradeNames: ["flock.synth", "autoInit"],
    
        synthDef: {
            ugen: "flock.ugen.playBuffer",
            mul: 0.25,
            trigger: {
                id: "trigger",
                ugen: "flock.ugen.valueChangeTrigger",
                rate: "control",
                source: 0.0
            },
            buffer: {
                id: "dsharp-piano",
                url: "../../lou/audio/22050/dsharp-piano-22050.wav"
            }
        }
    });

    fluid.defaults("colin.lou.guitar", {
        gradeNames: ["flock.synth", "autoInit"],
    
        synthDef: {
            ugen: "flock.ugen.playBuffer",
            mul: 0.5,
            trigger: {
                id: "trigger",
                ugen: "flock.ugen.valueChangeTrigger",
                rate: "control",
                source: 0.0
            },
            buffer: {
                id: "csharp-guitar",
                url: "../../lou/audio/22050/csharp-guitar-22050.wav"
            }
        }
    });

    fluid.defaults("colin.lou.drums", {
        gradeNames: ["flock.synth", "autoInit"],
    
        synthDef: {
            ugen: "flock.ugen.playBuffer",
            mul: 0.5,
            trigger: {
                id: "trigger",
                ugen: "flock.ugen.valueChangeTrigger",
                rate: "control",
                source: 0.0
            },
            buffer: {
                id: "tom",
                url: "../../lou/audio/22050/tom-22050.wav"
            }
        }
    });

}());
