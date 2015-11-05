/*global fluid*/

(function () {
    "use strict";

    fluid.defaults("colin.falling.bufferSynth", {
        gradeNames: "flock.modelSynth",

        synthDef: {
            ugen: "flock.ugen.out",
            bus: 0,
            expand: 1,
            sources: {
                id: "player",
                ugen: "flock.ugen.triggerGrains",
                buffer: "{that}.options.buffer",
                dur: {
                    ugen: "flock.ugen.math",
                    rate: "control",
                    source: {
                        ugen: "flock.ugen.math",
                        rate: "control",
                        source: 1.0,
                        sub: {
                            id: "grainDurScale",
                            ugen: "flock.ugen.value",
                            rate: "control",
                            value: 0.0,
                            mul: 5
                        }
                    },
                    mul: {
                        ugen: "flock.ugen.lfNoise",
                        options: {
                            interpolations: "linear"
                        },
                        freq: {
                            id: "grainDurRandom",
                            ugen: "flock.ugen.value",
                            value: 0.0,
                            add: 0.1
                        },
                        mul: 2.0,
                        add: { //was 2.5
                            id: "grainDurRandomAdd",
                            ugen: "flock.ugen.value",
                            value: 0.0,
                            mul: 0.5,
                            add: 5
                        }
                    }
                },
                speed: {
                    ugen: "flock.ugen.math",
                    source: 1.0,
                    sub: {
                        id: "speed",
                        ugen: "flock.ugen.value",
                        value: 0.0,
                        mul: 0.2
                    }
                },
                centerPos: {
                    ugen: "flock.ugen.lfNoise",
                    options: {
                        interpolation: "linear"
                    },
                    freq: 10,
                    mul: {
                        ugen: "flock.ugen.bufferDuration",
                        buffer: "{that}.options.buffer"
                    }
                },
                trigger: {
                    ugen: "flock.ugen.dust",
                    density: {
                        id: "grainDensity",
                        ugen: "flock.ugen.value",
                        rate: "control",
                        value: 0.0,
                        mul: 30,
                        add: 0.1
                    }
                }
            }
        },

        model: {
            inputs: {
                grainDensity: {
                    value: "{motionTarget}.model.front.leftMotion"
                },

                grainDurScale: {
                    value: "{motionTarget}.model.front.rightMotion"
                },

                grainDurRandom: {
                    value: "{motionTarget}.model.front.leftMotion"
                },

                grainDurRandomAdd: {
                    value: "{motionTarget}.model.front.rightMotion"
                },

                speed: {
                    value: "{motionTarget}.model.front.rightMotion"
                }
            }
        }
    });

    fluid.defaults("colin.falling.guitar", {
        gradeNames: "colin.falling.bufferSynth",

        buffer: "guitar",

        synthDef: {
            bus: 0,
            sources: {
                mul: 0.8
            }
        }
    });

    fluid.defaults("colin.falling.piano", {
        gradeNames: "colin.falling.bufferSynth",

        buffer: "piano",

        synthDef: {
            bus: 1
        },

        model: {
            inputs: {
                grainDensity: {
                    value: "{motionTarget}.model.front.leftMotion"
                },
                grainDurScale: {
                    value: "{motionTarget}.model.front.leftMotion"
                }
            }
        }
    });

    fluid.defaults("colin.falling.uke", {
        gradeNames: "colin.falling.bufferSynth",

        buffer: "uke",

        synthDef: {
            bus: 2
        }
    });

    fluid.defaults("colin.falling.vox", {
        gradeNames: "colin.falling.bufferSynth",

        buffer: "vox",

        synthDef: {
            bus: 3
        }
    });

    fluid.defaults("colin.falling.band", {
        gradeNames: "flock.band",

        components: {
            guitar: {
                type: "colin.falling.guitar"
            },

            piano: {
                type: "colin.falling.piano"
            },

            uke: {
                type: "colin.falling.uke"
            },

            vox: {
                type: "colin.falling.vox"
            }
        }
    });
}());
