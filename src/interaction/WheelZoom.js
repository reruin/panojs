P.module('P.interaction.WheelZoom',['P.interaction.Interaction','P.base.events','P.base.dom','P.anim.Anim'],function(interaction,events,dom,anim){
    function wheelZoom(pano){
        interaction.call(this,pano);
    }

    P.inherit(wheelZoom, interaction , {
        lookat : null , tick:false, count : 1,

        activate: function () {
            dom.on(this._pano._dragMask, "mousewheel", this._onMouseWheel, this);
        },

        deactivate: function () {
            dom.un(this._pano._dragMask, "mousewheel", this._onMouseWheel)
        },

        _doZoom : function(){

        },

        _onMouseWheel: function (e) {
            var delta = dom.event.getWheelDelta(e);
            //this.tick = true;
            var d = 0.004 * delta;
            //this.count += (delta < 0 : 1 : -1);
            var lookat = {x:e.clientX , y:e.clientY};

            /* this._startTime  = P.now();

             P.requestAnimationFrame(P.bind(this._doZoom , this) );

             if(this._pano.hasAnimation(this.timeline))
             {
             //this._pano.removeAnimation( this.timeline );
             this.count += (delta > 0 ? 1 : -1);
             }else{
             this._pano.frameSnapshot();
             this.count = (delta > 0 ? 1 : -1);
             }

             */

            anim.loop({
                duration : 300,
                onUpdate : P.bind(this._pano.setZoom, this._pano, d, true,false , lookat),
                onComplete : P.bind(this._pano.render , this._pano)
            });


            /*
             if(this.timeline) this._pano.removeAnimation( this.timeline );
             this.timeline = P.animation.zoom({zoom : this._pano.zoom + this.count*-0.1 , duration:300, lookat : lookat});
             console.log(this.count)
             this._pano.addAnimation( this.timeline )
             */


            dom.event.preventDefault(e);
            dom.event.stopPropagation(e);

            //P.logger("event : mousewhell , delta = " + delta);

        }
    })

    return wheelZoom;

})