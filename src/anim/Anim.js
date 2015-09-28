
P.module("P.anim.Anim",[],function(){
    function loop(options) {
        var callback = options.onUpdate;
        var duration = options.duration ||  Number.POSITIVE_INFINITY;
        var oncomplete = options.onComplete;
        var start = P.now();

        var handler = function () {
            if (P.now() - start <= duration) {
                callback();
                P.requestAnimationFrame( handler );
            } else {
                //complete
                if(oncomplete){  oncomplete();}
                handler = null;
            }
        };
        P.requestAnimationFrame( handler );
    }

    var easing = {
        inAndOut : function(a){return 3*a*a-2*a*a*a},

        linear : function(t) { return t; },

        upAndDown : function(t) {
            if (t < 0.5) {
                return easing.inAndOut(2 * t);
            } else {
                return 1 - easing.inAndOut(2 * (t - 0.5));
            }
        }
    };

    return {
        'loop':loop,
        'easing' : easing
    }
})