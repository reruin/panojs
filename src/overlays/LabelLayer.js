P.module('P.overlays.LabelLayer',['P.core.geom.spherical'],function(spherical){
    function LabelLayer(pano){
        this._pano = pano;
        this._list = {};
        //this._sceneReady = false;
        this.init();
    }

    LabelLayer.prototype = {
        init : function(){
            this._el = P.creat("div" , null , "pano-layers-label" , this._pano._control , "transform: translateZ(1000000000000px); z-index: 2002; position: absolute; left: 0px; top: 0px; ");
        },

        _calcCoord : function(v){

            //本地方式
            var p = v.options.position;
            //console.log(p)
            if(v.options.local)
                return {y:p.lat , x:p.lng};
            else {
                //TODO
                var ix = spherical.computeHeading(this._pano.getLocation().latLng, p) + (360 - this._pano._panoData.tiles.centerHeading);
                var dist = spherical.computeDistance(this._pano.getLocation().latLng , p);
                var iy = 0 - Math.atan(v.getAltitude() / dist) * 180 / Math.PI;
                v.setDistance(dist);
                //L(this._pano.getLocation().latLng,p,ix,"center heading:"+this._pano._panoData.tiles.centerHeading,"===<")
                return {y: iy, x: ix};
            }
        },

        _calcDist : function(v){
            if(v.options.local)
                return v.options.distance;
            else{
                return spherical.computeDistance(this._pano.getLocation().latLng , v.options.position);
            }

        },

        draw : function(target){
            if(target){
                this._drawItem(target._id);
            }else{
                for(var id in this._list)
                {
                    this._drawItem(id)
                }
            }
        },

        _drawItem:function(id)
        {

            var cur = this._list[id],
                p = this._pano._camera._projectSphere( cur.sphereCoord );

            if(p)
                cur.obj.setVisible(true)._moveTo(p);
            else
                cur.obj.setVisible(false);
        },

        update : function(v){
            this._list[v._id].sphereCoord = this._calcCoord(v);
            this.draw( v );
        },

        add : function(v){
            console.log('add:')
            console.log(v);
            this._el.appendChild(v._el);
            this._list[v._id] = {obj : v , sphereCoord : this._calcCoord(v) , dist : this._calcDist(v)};

            this.draw( v );
        },

        remove : function(v){
            var id = v.obj._id;

            this._el.removeChild(v.obj._el);
            delete this._list[id];
        },

        clear : function(){
            for(var i in this._list)
            {
                this.remove( this._list[i]);
            }
        }
    };

    return LabelLayer;
});