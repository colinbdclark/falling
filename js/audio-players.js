/*global fluid, flock, colin*/

(function () {
    "use strict";

    flock.init({
        bufferSize: 4096,
        chans: 4
    });

    fluid.defaults("colin.falling.audio", {
        gradeNames: "fluid.modelComponent",

        components: {
            bufferLoader: {
                type: "colin.falling.bufferLoader",
                options: {
                    listeners: {
                        afterBuffersLoaded: [
                            "{flock.enviro}.play()"
                        ]
                    }
                }
            },

            band: {
                type: "colin.falling.band"
            },

            motionTarget: {
                type: "windvane.stereoToQuadMotionTarget",
                options: {
                    components: {
                        front: {
                            options: {
                                listeners: {
                                    onMessage: [
                                        {
                                            funcName: "colin.falling.scaleMotionValue",
                                            args: ["{band}", "{arguments}.1"]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    // fluid.defaults("colin.falling.synth", {
    //     gradeNames: "flock.modelSynth",
    //
    //     // TODO: Factor into separate synth,
    //     // reusing a base grade definition to avoid all this
    //     // redundancy.
    //     synthDef: [
    //         {
    //             id: "guitarPlayer",
    //             ugen: "colin.ugen.movementPlayer",
    //             buffer: "guitar",
    //             loop: 1,
    //             speed: 0.0,
    //             reset: 0.1,
    //             trigger: 0.0
    //         },
    //
    //         {
    //             id: "pianoPlayer",
    //             ugen: "colin.ugen.movementPlayer",
    //             buffer: "piano",
    //             loop: 1,
    //             speed: 0.0,
    //             reset: 0.1,
    //             trigger: 0.0
    //         },
    //
    //         {
    //             id: "ukePlayer",
    //             ugen: "colin.ugen.movementPlayer",
    //             buffer: "uke",
    //             loop: 1,
    //             speed: 0.0,
    //             reset: 0.1,
    //             trigger: 0.0
    //         },
    //
    //         {
    //             id: "voxPlayer",
    //             ugen: "colin.ugen.movementPlayer",
    //             buffer: "vox",
    //             loop: 1,
    //             speed: 0.0,
    //             reset: 0.1,
    //             trigger: 0.0
    //         }
    //     ]
    // });
    //
    var lastMove = Date.now();
    colin.falling.scaleMotionValue = function (band, value) {
        var scaled = value < 0.00005 ? 1.0 : 1.0 - value, //(value * 5),
            trigger = scaled > 0.5 ? 1.0 : 0.0,
            isFairlyStill = value < 0.0005;

        console.log("Raw value:", value, "scaled value:", scaled, "trigger value: ", trigger);

        if (!isFairlyStill) {
            lastMove = Date.now();
        } else {
            if (Date.now() - lastMove > 15000) {
                // Sync right with left.
                // var right = synth.get("guitarPlayer"),
                //     left = synth.get("pianoPlayer");
                // right.model.idx = left.model.idx;

                // TODO: Think this through more clearly.
                var synths = band.getSynths();
                for (var i = synths.length - 1; i < 1; i--) {
                    synths[i - 1].set("player.model.idx", synths[i].get("player.model.idx"));
                }

                lastMove = Date.now();
                console.log("synchronizing");
            }
        }

        band.set({
            "player.speed": scaled,
            "player.trigger": trigger,
            "player.start": isFairlyStill ? 0 : Math.random(),
        });
    };

}());
