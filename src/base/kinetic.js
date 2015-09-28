/**
 * Created by Administrator on 2014/11/6.
 */
P.module("P.base.kinetic",[],function() {
    function kinetic(decay, minVelocity, delay) {

        //加速度a，负值
        this.decay_ = decay || -0.008;
        //速度阈值，px/ms
        this.minVelocity_ = minVelocity || 0.01;
        this.delay_ = delay || 200;
        this.points_ = [];
        this.angle_ = 0;
        this.initialVelocity_ = 0;
    };

    kinetic.prototype = {
        begin : function() {
            this.points_.length = 0;
            this.angle_ = 0;
            this.initialVelocity_ = 0;
        },

        update : function(x, y) {
            this.points_.push(x, y, P.now());
        },

        end : function() {
            if (this.points_.length < 6) {
                // at least 2 points are required (i.e. there must be at least 6 elements
                // in the array)
                //console.log("less than 6")
                return false;
            }
            var delay = P.now() - this.delay_;
            var lastIndex = this.points_.length - 3;
            if (this.points_[lastIndex + 2] < delay) {
                // the last tracked point is too old, which means that the user stopped
                // panning before releasing the map
                return false;
            }

            // get the first point which still falls into the delay time
            var firstIndex = lastIndex - 3;
            while (firstIndex > 0 && this.points_[firstIndex + 2] > delay) {
                firstIndex -= 3;
            }
            var duration = this.points_[lastIndex + 2] - this.points_[firstIndex + 2];
            var dx = this.points_[lastIndex] - this.points_[firstIndex];
            var dy = this.points_[lastIndex + 1] - this.points_[firstIndex + 1];
            this.angle_ = Math.atan2(dy, dx);
            this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / duration;
            return this.initialVelocity_ > this.minVelocity_;
        },

        pan : function(from , to) {
            var decay = this.decay_;
            var initialVelocity = this.initialVelocity_;
            var velocity = this.minVelocity_ - initialVelocity;
            var duration = this.getDuration_();

            var easingFunction = (

                function(t) {
                    return initialVelocity * (Math.exp((decay * t) * duration) - 1) /
                        velocity;
                });

            return {
                type : "pan",
                heading : to[0],
                pitch : to[1],
                from : from,
                duration: duration,
                easing: easingFunction,
                start : P.now()
            };
        },


        getDuration_ : function() {
            return Math.log(this.minVelocity_ / this.initialVelocity_) / this.decay_;
        },

        getDistance : function() {
            return (this.minVelocity_ - this.initialVelocity_) / this.decay_;
        },

        getAngle : function() {
            return this.angle_;
        }
    }

    /**
     ** easing
     */
    var easing = {
        inAndOut : function(a){return 3*a*a-2*a*a*a},

        linear : function(t) { return t; },

        upAndDown : function(t) {
            if (t < 0.5) {
                return P.easing.inAndOut(2 * t);
            } else {
                return 1 - P.easing.inAndOut(2 * (t - 0.5));
            }
        }
    };

    return kinetic;
});
