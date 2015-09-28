P.module("P.overlays.Overlay",[
    'P.core.geom.Point',
    'P.core.geom.Latlng'
],function(Point,Latlng){
    var Overlay = function(opts){
        this.options = {position : new Latlng() , altitude : 0 , content : "", visible:true, pano : null , type : "" , local : false , scale : 0.8};
        this._pano = null;
        this._labelLayer = null;
        //this._id = P.stamp(this);
        //console.log(this._id)
        this.pre = P.prefix.css+"transform";
        //P.Utils.extend(this, P.base.events);
    }

    Overlay.prototype = {
        init : function(){},

        getPano:function(){ return this._pano; },

        getPosition : function(){ return this.options.position;},

        getAltitude : function(){ return this.options.altitude; },

        setPano : function(pano){
            if(pano === null){
                if(this._labelLayer){

                    this._labelLayer.remove(this);
                    this._labelLayer = null;
                }
                if( this._pano  ) this._pano = null;
                return this;
            }
            this._pano = pano;
            this._labelLayer = pano._labelLayer;
            this._labelLayer.add(this);
            //if(this.local == false) this.setLocation();
            return this;

        },
        setVisible:function(v){
            if(this.options.visible != v)
            {
                this.options.visible = v;
                this._el.style.display = v ? "block" : "none";

            }
            return this;
        },
        setPosition : function(v){
            this.options.position = v ;
            this._draw();
            return this;
        },

        setLocation : function(o){
            if(o.altitude)
            {
                this.options.position = o.position;
                this.options.altitude = o.altitude;
                this.options.local = false;
            }
            if(o.distance)
            {
                this.options.position = o.position;
                this.options.distance = o.distance;
                this.options.local =  true;
                //console.log(this.position)
                this.setDistance(o.distance);
            }
            //this._el.style.transform = "scale("+scale+","+scale+")";
            return this;
        },

        setDistance : function(d){
            var scale = (120 - d) / 120;
            //alert(scale)
            scale = 0.9 * scale + 0.6 * (1-scale);
            this.options.scale = scale;
            this._el.style.transform = "scale("+scale+","+scale+")";
            if(d>120) this._el.style.visibility = "hidden";
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        },
        _moveTo : function(v){
            //console.log(this._el)
            //var l = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate(-px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px)";
            //var ix = v.x + this.options.size[0]*-0.5 , iy = v.y + this.options.size[0]*-1;
            this._el.style[this.pre] = "translateX("+ v.x+"px) translateY("+ v.y+"px)";
            //this._el.style[this.pre] = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate("+this.options.size[0]*0.5+"px, "+(-this.options.size[1])+"px) rotate(0deg) translate(0px, 0px) scale(1,1) translate(0px, 0px)";

            //console.log(this.options.type)
            //console.log(this._el.style[this.pre+"Transform"])

            // left top
            //var ix = v.x + this.options.size[0]*-0.5 , iy = v.y + this.options.size[0]*-1;
            /*this._el.style.left = Math.round(ix)+"px";
             this._el.style.top  = Math.round(iy) + "px";*/

        }
    };
    //Camera3D.prototype = new away3d.Object3D();

    return Overlay;
});