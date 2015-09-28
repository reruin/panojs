P.module('P.overlays.Label',[
    'P.core.geom.Latlng',
    'P.overlays.Overlay',
    'P.base.utils',
    'P.base.events'
],function(Latlng, Overlay, utils , events){

    //P.overlays = {};

    function Label(opts)
    {
        this.options = {position : new Latlng() , altitude : 0 , content : "", visible:true, pano : null , type : "" , local : false , scale : 0.8};
        this._pano = null;
        this._labelLayer = null;
        this._icon = {url:"" , size : {w:54 , h:54}}

        this._id = P.stamp(this);

        this.init(opts);
    }

    P.inherit(Label,Overlay,{
        mixin : events,

        setContent : function( v ){
            this._contentDiv.innerHTML = v;

            var w = utils.getLength(v);


            this._el.style.width = (this._icon.size.w + w) + "px";
            console.log(this._el.style);
            if(v) this._contentDiv.style.display = "block";
            else this._contentDiv.style.display = "none";
            this._draw();
            return this;

/*            if(v == "") this._contentDiv.style.display = "none";
            else this._contentDiv.style.display = "block";*/
        },

        init : function(opts){


            P.setOptions(this, opts);

            var cls = this.options.type != "" ? (" label-"+this.options.type):"";

            this._el = P.creat("div" , null , "pano-overlay-label"+cls, null, "position: absolute; left: 0px; top: 0px;display:block;",{action:opts.action});

            this._iconDiv = P.creat("img",null,null,this._el,"");

            this._contentDiv = P.creat("span",null,null,this._el,"");

            if(this.options.type != "")
                this._iconDiv.src = "assets/icons/"+ this.options.type+".png";

            //if(this.options.type) P.creat("div" , null , "pano-overlay-labelIcon"+cls , this.el, "position: absolute; left: 0px; top: 0px;display:block;");

            if(this.options.content)
                this.setContent(this.options.content);

            if(this.options.location)
                this.setLocation(this.options.location);

            if(this.options.pano)
                this.setPano(this.options.pano);

            this._regListeners();

        },


        _regListeners:function(){
            P.on(this._el,"click",this._onClick,this);
            //P.on(this._el,"touchend",this._onClick,this);
            /* this._dragObj = new P.proto.DragObject(this._el, this);

             this._dragObj.on({
             'dragstart': this._onDragStart,
             'dragend': this._onDragEnd
             }, this).activate();
             P.on(this._el,)*/
        },
        _onClick : function(e){

            var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
            action = action.split(",");

            if(action[0]=="setPano") this._pano.setPano(action[1]);
            else this._pano.get.apply(this._pano ,action );
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        }
    })
    /*Label.prototype = {



        _moveTo : function(v){
            this._el.style.left = Math.round(v.x)+"px";
            this._el.style.top = Math.round(v.y) + "px";

        },

        getPano:function(){ return this._pano; },

        getPosition : function(){ return this.options.position;},

        getAltitude : function(){ return this.options.altitude; },

        getContent : function(){ return this.options.content},

        getVisible : function()
        {
            return this.options._visiable;
        },

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
        _reset:function(){

        },
        setPosition : function(v){
            this.options.position = v ;
            this._draw();
            return this;
        },

        setAltitude : function( v ){  this.options.altitude = v; this._draw(); return this; },

        setContent : function( v ){
            this._contentDiv.innerHTML = this.options._content = v;
            if(v == "") this._contentDiv.style.display = "none";
            else this._contentDiv.style.display = "block";
            this._draw();
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
        }
        ,

        setDistance : function(d){
            var scale = (120 - d) / 120;
            //alert(scale)
            scale = 0.9 * scale + 0.6 * (1-scale);
            this.options.scale = scale;
            this._el.style.transform = "scale("+scale+","+scale+")";
            if(d>120) this._el.style.visibility = "hidden";
        }

    }*/

    //factory

    P.label = function(opts){ return new Label(opts); }

    return Label;
})