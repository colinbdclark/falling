(function () {
    "use strict";
    
    fluid.registerNamespace("colin");

    fluid.defaults("colin.webcam", {
        gradeNames: ["fluid.viewComponent", "autoInit"],
        
        listeners: {
            onCreate: [
                {
                    funcName: "colin.webcam.setupStream",
                    args: ["{that}.container.0"]
                },
                {
                    funcName: "colin.webcam.bindMethods",
                    args: ["{that}"]
                }
            ]
        }
    });
    
    colin.webcam.setupStream = function (video) {
        navigator.getMedia = navigator.getUserMedia || navigator.mozGetUserMedia || navigator.webkitGetUserMedia;
        navigator.getMedia({
            video: true,
            audio: false
        }, function (stream) {
            colin.webcam.bindMediaStreamToVideo(stream, video);
        }, function (errMsg) {
            console.log(errMsg);
        });
    };
    
    colin.webcam.bindMediaStreamToVideo = function (stream, video) {
        if (navigator.mozGetUserMedia) {
            video.mozSrcObject = stream;
        } else {
            var URL = window.URL || window.webkitURL;
            video.src = URL.createObjectURL(stream);
        }
        
        video.play();
        return video;
    };
    
    colin.webcam.bindMethods = function (that) {
        that.snapshot = function (ctx, w, h) {
            ctx.drawImage(that.container[0], 0, 0, w, h);
            return ctx.getImageData(0, 0, w, h);
        };
    };
    
}());
