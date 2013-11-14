(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");

    flock.init({
        bufferSize: 64,
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

        bpm: 104
    });

    fluid.defaults("colin.lou.synths.clock.motion", {
        gradeNames: ["colin.lou.synths.clock"],

        synthDef: {
            ugen: "flock.ugen.out",
            expand: 1,
            sources: {
                ugen: "flock.ugen.impulse",
                rate: "audio",
                freq: {
                    rate: "audio",
                    ugen: "colin.lou.ugen.pulseToFreq",
                    bpm: "{that}.options.bpm",
                    pulse: {
                        rate: "audio",
                        ugen: "colin.lou.ugen.lag",
                        time: 10,
                        source: {
                            rate: "audio",
                            ugen: "colin.lou.ugen.quantize",
                            steps: 4,
                            source: {
                                id: "motion",
                                ugen: "colin.lou.ugen.dynamicValue",
                                mul: 3
                            },
                            mul: 0.5,
                            add: 1.0
                        }
                    }
                }
            }
        }
    });
    
    fluid.defaults("colin.lou.synths.clock.static", {
        gradeNames: ["colin.lou.synths.clock"],
        
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
    
    
    fluid.defaults("colin.lou.synths.pianoClock", {
        gradeNames: ["colin.lou.synths.clock.static", "colin.lou.synths.halfSpeedClock", "autoInit"],
        
        bpm: 52,
        pulse: 1.25,
        
        synthDef: {
            bus: 2
        }
    });
    
    fluid.defaults("colin.lou.synths.guitarClock", {
        gradeNames: ["colin.lou.synths.clock.static", "colin.lou.synths.halfSpeedClock", "autoInit"],
        
        bpm: 52,
        pulse: 1.5,
        
        synthDef: {
            bus: 3
        }
    });
    
    fluid.defaults("colin.lou.synths.drumClock", {
        gradeNames: ["colin.lou.synths.clock.motion", "autoInit"],
        
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
                ugen: "flock.ugen.sin",
                freq: {
                    ugen: "flock.ugen.math",
                    rate: "audio",
                    source: (146 * (2 / 3)) / 2,
                    mul: {
                        ugen: "colin.lou.ugen.lag",
                        rate: "audio",
                        time: 10,
                        source: {
                            id: "motion",
                            ugen: "colin.lou.ugen.dynamicValue",
                            rate: "audio",
                            mul: 0.75,
                            add: 1.0
                        }
                    }
                },
                mul: 0.75
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
                start: {
                    ugen: "colin.lou.ugen.quantize",
                    steps: 2,
                    source: {
                        id: "pianoStart",
                        ugen: "colin.lou.ugen.dynamicValue",
                        mul: 2
                    },
                    mul: 0.5
                },
                end: {
                    ugen: "colin.lou.ugen.quantize",
                    steps: 2,
                    source: {
                        id: "pianoEnd",
                        ugen: "colin.lou.ugen.dynamicValue",
                        mul: 2
                    },
                    add: 0.5
                },
                trigger: {
                    id: "pianoTrigger",
                    ugen: "flock.ugen.in",
                    bus: 2
                },
                buffer: {
                    id: "dsharp-piano",
                    url: "../lou/audio/22050/piano-combined-22050.wav"
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

    colin.lou.synths.convertBeatsToFreq = function (beats, bpm) {
        return (bpm / beats) / 60;
    };
    
    
    fluid.registerNamespace("colin.lou.ugen");

    colin.lou.ugen.lag = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);

        that.gen = function (numSamps) {
            var m = that.model,
                out = that.output,
                inputs = that.inputs,
                time = inputs.time.output[0],
                source = inputs.source.output,
                prevSamp = m.prevSamp,
                lagCoef = m.lagCoef,
                i,
                j,
                currSamp,
                outVal;
            
            if (time !== m.prevTime) {
                m.prevtime = time;
                lagCoef = m.lagCoef = time === 0 ? 0.0 : Math.exp(flock.LOG001 / (time * m.sampleRate));
            }
            
            for (i = j = 0; i < numSamps; i++, j += m.strides.source) {
                currSamp = source[j];
                outVal = currSamp + lagCoef * (prevSamp - currSamp);
                out[i] = prevSamp = outVal;
            }
            
            m.prevSamp = prevSamp;
            
            that.mulAdd(numSamps);
        };
        
        that.onInputChanged();
        return that;
    };
    
    fluid.defaults("colin.lou.ugen.lag", {
        rate: "audio",
        inputs: {
            source: undefined,
            time: 0.1
        },
        ugenOptions: {
            strideInputs: ["source"],
            model: {
                prevSamp: 0.0,
                lagCoef: 0.0,
                prevTime: 0.0
            }
        }
    });
    
    /**
     * Represents a signal whose value is changed "behind the scenes" by some other process.
     *
     * To change this unit generator's value, update its model.value property.
     */
    colin.lou.ugen.dynamicValue = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        
        that.gen = function (numSamps) {
            var out = that.output,
                m = that.model,
                i;
            
            for (i = 0; i < numSamps; i++) {
                out[i] = m.value;
            }
            
            that.mulAdd(numSamps);
        };
        
        that.onInputChanged();
        return that;
    };
    
    fluid.defaults("colin.lou.ugen.dynamicValue", {
        rate: "control",
        ugenOptions: {
            model: {
                value: 0
            }
        }
    });

    colin.lou.ugen.indexArray = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        
        that.gen = function (numSamps) {
            var m = that.model,
                out = that.output,
                inputs = that.inputs,
                list = that.inputs.list,
                index = that.inputs.index.output,
                i,
                j,
                indexRounded;
            
            for (i = j = 0; i < numSamps; i++, j += m.strides.index) {
                indexRounded = Math.round(index[j]);
                indexRounded = indexRounded < 0 ? 0 : indexRounded > list.length ? list.length - 1 : indexRounded;
                out[i] = list[indexRounded];
            }
            
            that.mulAdd(numSamps);
        };
        
        that.onInputChanged();
        return that;
    };
    
    fluid.defaults("colin.lou.ugen.indexArray", {
        rate: "control",
        inputs: {
            index: 0,
            list: []
        },
        ugenOptions: {
            strideInputs: ["index"],
            noExpand: ["list"]
        }
    });
    
    colin.lou.ugen.pulseToFreq = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        
        that.gen = function (numSamps) {
            var m = that.model,
                out = that.output,
                inputs = that.inputs,
                bpm = inputs.bpm.output[0],
                pulse = inputs.pulse.output[0],
                value = m.value,
                i;
            
            if (bpm !== m.prevBPM || pulse !== m.prevPulse) {
                m.prevBPM = bpm;
                m.prevPulse = pulse;
                value = m.value = (bpm / pulse) / 60;
            }
            
            for (i = 0; i < numSamps; i++) {
                out[i] = value;
            }
            
            that.mulAdd(numSamps);
        };
        
        that.onInputChanged();
        return that;
    };
    
    fluid.defaults("colin.lou.ugen.pulseToFreq", {
        rate: "control",
        inputs: {
            bpm: 60,
            pulse: 1
        },
        ugenOptions: {
            model: {
                prevBPM: 0,
                prevPulse: 0,
                value: 0
            }
        }
    });
    
    // Source values should be in the range of 0..1 (values lower or higher will be clipped to 0 or 1, respectively)
    colin.lou.ugen.quantize = function (inputs, output, options) {
        var that = flock.ugen(inputs, output, options);
        
        that.gen = function (numSamps) {
            var m = that.model,
                out = that.output,
                inputs = that.inputs,
                source = inputs.source.output,
                steps = inputs.steps.output[0],
                i,
                j,
                k;
            
            if (steps !== m.steps) {
                m.steps = steps;
                m.stepValue = steps > 0 ? 1.0 / steps : 0;
                m.halfStep = m.stepValue / 2;
            }
            
            for (i = j = 0; i < numSamps; i++, j += m.strides.source) {
                var val = source[j],
                    quantized = 1;
                
                if (val <= 0) {
                    quantized = 0;
                } else if (val >= 1.0){
                    quantized = 1.0;
                } else {
                    for (k = m.stepValue; k < m.steps; k += m.stepValue) {
                        if (val <= k) {
                            quantized = val < (k - m.halfStep) ? k - m.stepValue : k;
                            break;
                        }
                    }
                }
                
                out[i] = quantized;                
            }
            
            that.mulAdd(numSamps);
        };
        
        that.onInputChanged();
        return that;
    };
    
    fluid.defaults("colin.lou.ugen.quantize", {
        rate: "audio",
        inputs: {
            steps: 4,
            source: undefined
        },
        ugenOptions: {
            strideInputs: ["source"],
            model: {
                steps: 0,
                stepValue: 0
            }
        }
    });
}());
