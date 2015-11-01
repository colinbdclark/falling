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
                ugen: "flock.ugen.playBuffer",
                loop: 1.0,
                speed: 0.0,
                start: 0.1,
                trigger: 0.0
            }
        }
    });

    fluid.defaults("colin.falling.guitar", {
        gradeNames: "colin.falling.bufferSynth",

        synthDef: {
            bus: 0,
            sources: {
                buffer: "guitar",
                mul: 0.8
            }
        }
    });

    fluid.defaults("colin.falling.piano", {
        gradeNames: "colin.falling.bufferSynth",

        synthDef: {
            bus: 1,
            sources: {
                buffer: "piano"
            }
        }
    });

    fluid.defaults("colin.falling.uke", {
        gradeNames: "colin.falling.bufferSynth",

        synthDef: {
            bus: 2,
            sources: {
                buffer: "uke"
            }
        }
    });

    fluid.defaults("colin.falling.vox", {
        gradeNames: "colin.falling.bufferSynth",

        synthDef: {
            bus: 3,
            sources: {
                buffer: "vox"
            }
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
