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
                type: "windvane.quadraphonicMotionTarget",
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

    fluid.defaults("colin.falling.audio.singleCamera", {
        gradeNames: "colin.falling.audio",

        components: {
            motionTarget: {
                type: "windvane.stereoToQuadMotionTarget"
            }
        }
    });

    var lastMove = Date.now();
    colin.falling.scaleMotionValue = function (band, value) {
        var scaled = value < 0.00005 ? 1.0 : 1.0 - (value * 5),
            trigger = scaled > 0.5 ? 1.0 : 0.0,
            isFairlyStill = value < 0.0005;

        console.log("Raw value:", value, "scaled value:", scaled, "trigger value: ", trigger);

        if (!isFairlyStill) {
            lastMove = Date.now();
        } else {
            if (Date.now() - lastMove > 15000) {
                // Sync right with left.
                // TODO: This implementation is garbage, and produces it.
                var synths = band.getSynths(),
                    lastSynth = synths.pop(),
                    idx = lastSynth.get("player").model.idx;

                for (var i = 0; i < synths.length; i++) {
                    synths[i].get("player").model.idx = idx;
                }

                lastMove = Date.now();
                console.log("synchronizing");
            }
        }

        band.set({
            "player.speed": scaled,
            "player.trigger": trigger,
            "player.start": isFairlyStill ? 0 : Math.random()
        });
    };
}());
