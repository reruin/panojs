P.module('P.interaction.PinchZoom',['P.interaction.Interaction','P.base.events','P.base.dom','P.core.geom.Point'],function(interaction,events,dom,Point){
    function PinchZoom(pano){
        interaction.call(this,pano);
    }

    P.inherit(PinchZoom, interaction , {
        CLASS_NAME: "P.interaction.PinchZoom",
        _onactive:false,_zoomed:false,
        activate: function () {

            P.on(this._pano._dragMask, "touchstart", this._onTouchStart, this);

        },

        deactivate: function () {
            P.un(this._pano._dragMask, "touchstart", this._onTouchStart);
        },

        _onTouchStart: function (e) {

            var pano = this._pano;
            //if(e.touches.length > 1) alert(e.touches.length)
            //P.logger("touches : " + e.touches.length + ", result : " + (!e.touches || e.touches.length !== 2));
            if (e.touches && e.touches.length <2) {
                this._onactive = false;
                return;
            }

            this._onactive = true;
            var p1 = new Point(e.touches[0].clientX, e.touches[0].clientY),
                p2 = new Point(e.touches[1].clientX, e.touches[1].clientY);
            //viewCenter = _pano.getCenter();

            this._startCenter = p1.interpolate(p2, 0.5);
            //this._povCenter = this._pano._camera._unprojectSphere( this._startCenter );

            this._lookat = this._startCenter;

            this._tick = Math.min(this._pano.viewWidth,this._pano.viewHeight);

            this._startDist = p1.distanceTo(p2) + this._tick;

            //this._centerOffset = viewCenter.subtract(this._startCenter);
            this._oriZoom = this._pano.getZoom();
            //P.logger("ori zoom : " + this._oriZoom + " , distance : " + this._startDist);

            P.on(this._pano._dragMask, 'touchmove', this._onTouchMove, this)
                .on(this._pano._dragMask, 'touchend', this._onTouchEnd, this);
            dom.event.preventDefault(e);
        },

        _onTouchMove: function (e) {

            if (e.touches && e.touches.length <2) {
                //this._lookat = null;
                this._onactive = false;
                return;
            }

            var pano = this._pano;

            if(this._onactive == false) return;

            var p1 = new Point(e.touches[0].clientX, e.touches[0].clientY),
                p2 = new Point(e.touches[1].clientX, e.touches[1].clientY);


            this._scale = (p1.distanceTo(p2) + this._tick) / this._startDist;

            //缩放中心偏移
            //this._delta = p1.interpolate(p2, 0.5).subtract(this._startCenter);

            if (this._zoomed == false) {
                dom.addClass(pano._viewport, 'pano-touching');
                // trigger pano event
                pano
                    //.trigger('movestart')
                    .trigger('zoomstart');

                this._zoomed = true;
            }

            //非递增 禁止updatetiles
            pano.setZoom(this._oriZoom * (1/this._scale) , false , false,this._lookat);
            //P.logger("distance : " + p1.distanceTo(p2) + " , Dist : " + this._startDist + ", orizoom :" + this._oriZoom + " , scale : " + this._scale);
            //pano._panTo(this._povCenter , this._startCenter);
            dom.event.preventDefault(e);
        },

        _onTouchEnd: function () {

            var pano = this._pano;

            this._onactive = false;
            this._zoomed = false;
            dom.removeClass(_pano._viewport, 'pano-touching');

/*            P
                .un(document, 'touchmove', this._onTouchMove)
                .un(document, 'touchend', this._onTouchEnd);*/

            //P._pano.render();
        },

        _getScaleOrigin: function () {
            var co = this._centerOffset.subtract(this._delta).divideBy(this._scale);
            return this._startCenter.add(co);
        }
    })

    return PinchZoom;
})