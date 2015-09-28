P.module('P.anim.Timeline',['P.anim.Anim'],function(anim){
     function timeline(pano){
        this.pano = pano;
        this.frameState = pano._frameState;
        this.fn = {};
        this.runing = false;
        this.pano.frameSnapshot();
        this.start = 0;
        this.totalDuration = 0;
        this.count = 0;
    }


    timeline.prototype = {
        /**
         * 动作类型
         *
         */
        wait : function(time)
        {
            this.totalDuration += time;
            return this;
        },

        pan : function(heading,pitch, duration){
            return this.addTo({pan:{heading:heading , pitch : pitch , duration:duration}});
        },

        zoom : function(zoom , duration){
            return this.addTo({zoom:{zoom : zoom , duration:duration}});
        },

        bounce:function(zoom , duration ){
            return this.addTo({bounce:{zoom : zoom , duration:duration}});
        },

        fly:function(heading , pitch , zoom , duration , isbounce){

            var ob = {
                pan:{heading:heading , pitch : pitch , duration:duration}
            };
            ob[isbounce === true ? "bounce" :"zoom"] = {zoom : zoom , duration:duration};
            return this.addTo(ob);
        },

        creat : function(type , d , duration, start){
            if(type == "pan")
            {
                var ob =  {type : "pan", start:start , duration : duration , easing: "linear",easingFn:anim.easing.linear, from:this.frameState.pan};
                if(d.heading !== null) ob.heading = d.heading;
                if(d.pitch !==null) ob.pitch = d.pitch;
                return ob;
            }else if(type == "zoom")
            {
                return {type : "zoom", start:start , duration : duration , zoom : d.zoom , easing: "linear",easingFn:anim.easing.linear, from:this.frameState.zoom};
            }else if(type == "bounce"){
                return {type : "zoom", start:start , duration : duration , zoom : d.zoom , easing: "upAndDown",easingFn:anim.easing.upAndDown, from:this.frameState.zoom}
            }
        },

        addTo : function(o){
            o = o || {};
            var dur = 0;
            if(this.runing == false) {this.start = P.now();this.totalDuration = 0;}
            var start = this.start + this.totalDuration;

            for(var i in o)
            {
                var d = o[i];
                var dur_ = d.duration || 1000;
                dur = Math.max( dur , dur_);
                this.add( this.creat( i , d , dur_ , start) );
                // console.log("start:"+this.totalDuration+",duration:"+dur_+" for " + i)
            }

            this.totalDuration += dur;

            return this;
        },

        _step : function(a , frameState){
            // console.log(frameState)
            // console.log("here is : "+(frameState.time - start)+", start:"+start+",duration:"+duration)
            //console.log("====>"+key)

            var key = a.type;
            if (frameState.time < a.start) {
                frameState.animate = true;
                frameState.process[key] = true;
                //获取值 快照
                a.from = frameState[key];

                return true;
            }
            else if (frameState.time < a.start + a.duration) {
                frameState.animate = true;
                frameState.process[key] = true;


                var easeFn = (typeof(a.easing) == 'function') ? a.easing : anim.easing[a.easing];

                var delta = easeFn((frameState.time - a.start) / a.duration); //[0,1]
                if(key == "pan"){
                    var deltaX = a.heading - a.from[0];
                    var deltaY = a.pitch - a.from[1];
                    frameState.pan.heading = a.from[0] + delta * deltaX;
                    frameState.pan.pitch = a.from[1] + delta * deltaY;
                    //console.log("animate "+key+":"+frameState.pan.heading+","+ frameState.pan.pitch)

                }else
                {
                    frameState[key] = a.from + delta * (a[key] - a.from);
                    //console.log("animate :"+key+":"+frameState[key])
                }

                //console.log("sourceX :"+sourceX);


                return true;
            } else {
                frameState.process[key] = false;
                return false;
            }
        },

        inTimeline:function(v){

        },

        update : function(){
            this.frameState.time = P.now();
            var change = false;
            for(var i in this.fn)
            {
                //console.log(this.fn[i])
                var m = this._step( this.fn[i], this.frameState);
                if(m == false) this.remove(i);
                change = change || m;
            }

            if( change )
            {
                //console.log(this.frameState.pov[0])
                if(this.frameState.process.pan) this.pano.setPov(this.frameState.pan ,false , false);
                if(this.frameState.process.zoom) this.pano.setZoom( this.frameState.zoom , false, false, this.frameState.lookat); //console.log( this.frameState.zoom )}
                P.requestAnimationFrame( P.bind( this.update, this) );

            }else{
                //TODO 是否做检测
                this.pano.render(true);

                this.timeline = null;

                this.runing = false;
            }
        }
        ,

        add : function(animate){
            //console.log(this.fn[animate])
/*            if(typeof(animate.easing) == 'function'){
                animate.easingFn =
            }*/
            this.fn[++this.count] = animate;

            if(this.runing == false)
            {
                this.pano.frameSnapshot();
                P.requestAnimationFrame( P.bind( this.update, this) );
                this.runing = true;
            }
            return this.count;
        },

        remove : function(i){
            if(this.fn[i]){
                delete this.fn[i];
            }
            this.pano.frameSnapshot();

        },
        clear : function(){
            for(var i in this.fn)
                delete this.fn[i];
            this.pano.frameSnapshot();
        },

        has : function(v) { return (v in this.fn) }
    };

    return timeline;
})