(function () {
    "use strict";

    var fluid = require("infusion"),
        flock = fluid.require("flocking"),
        colin = fluid.registerNamespace("colin");

    flock.init({
        bufferSize: 4096
    });

    fluid.defaults("colin.veryVery.movementResponder", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        buffers: [
            {
                id: "guitar",
                url: "sound/audio-files/Guitar.wav"
            },
            {
                id: "piano",
                url: "sound/audio-files/Piano.wav"
            }
        ],

        components: {
            synth: {
                createOnEvent: "onBuffersLoaded",
                type: "flock.synth",
                options: {
                    synthDef: [
                        {
                            id: "leftPlayer",
                            ugen: "colin.ugen.movementPlayer",
                            buffer: "guitar",
                            loop: 1,
                            speed: 0.0,
                            reset: 0.1,
                            trigger: 0.0
                        },

                        {
                            id: "rightPlayer",
                            ugen: "colin.ugen.movementPlayer",
                            buffer: "piano",
                            loop: 1,
                            speed: 0.0,
                            reset: 0.1,
                            trigger: 0.0
                        }
                    ]
                }
            },

            motionSource: {
                type: "colin.veryVery.motionSource.net"
            }
        },

        events: {
            onBuffersLoaded: null
        },

        listeners: {
            onCreate: [
                {
                    funcName: "colin.veryVery.movementResponder.loadBuffers",
                    args: ["{synth}.enviro", "{that}.options.buffers", "{that}.events.onBuffersLoaded.fire"]
                }
            ],

            onBuffersLoaded: {
                funcName: "{that}.synth.play"
            }
        }
    });


    fluid.defaults("colin.veryVery.motionSource.net", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        components: {
            server: {
                type: "colin.udpServer",
                options: {
                    listeners: {
                        onMessage: {
                            funcName: "colin.veryVery.motionSource.net.scaleValue",
                            args: ["{synth}", "{arguments}.0"]
                        }
                    }
                }
            }
        },

        events: {
            onMotion: null
        }
    });

    colin.veryVery.movementResponder.loadBuffers = function (enviro, bufferSpecs, onBuffersLoaded) {
        var decodedBuffers = [];
        var fireAfterAllLoaded = function (decoded) {
            decodedBuffers.push(decoded);

            if (decodedBuffers.length === bufferSpecs.length) {
                onBuffersLoaded(decodedBuffers);
                console.log("all buffers loaded!");
            }
        };

        for (var i = 0; i < bufferSpecs.length; i++) {
            flock.parse.bufferForDef(bufferSpecs[i], fireAfterAllLoaded, enviro);
        }
    };

    var lastMove = Date.now();
    colin.veryVery.motionSource.net.scaleValue = function (synth, rawMotionMessage) {
        var value = rawMotionMessage.readFloatLE(0),
            scaled = value < 0.00005 ? 1.0 : 1.0 - (value * 5),
            trigger = scaled > 0.5 ? 1.0 : 0.0,
            isFairlyStill = value < 0.0005;

        //scaled = Math.max(0, scaled);
        console.log("Raw value:", value, "scaled value:", scaled, "trigger value: ", trigger);

        if (!isFairlyStill) {
            lastMove = Date.now();
        } else {
            if (Date.now() - lastMove > 15000) {
                // Sync right with left.
                var right = synth.get("rightPlayer"),
                    left = synth.get("leftPlayer");

                right.model.idx = left.model.idx;
                lastMove = Date.now();
                console.log("synchronizing");
            }
        }

        synth.set({
            "leftPlayer.speed": scaled,
            "leftPlayer.trigger": trigger,
            "leftPlayer.reset": isFairlyStill ? 0 : Math.random(),

            "rightPlayer.speed": scaled,
            "rightPlayer.trigger": trigger,
            "rightPlayer.reset": isFairlyStill ? 0 : Math.random()
        });
    };
}());
