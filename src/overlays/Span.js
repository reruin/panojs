P.module('P.overlays.Span',['P.core.geom.Latlng','P.base.utils'],function(Latlng , utils){

    function Span(opts){
        this.options = {position : new Latlng() , content : "", visible:true, pano : null , type : "" ,local : true};
        this._pano = null;
        this._labelLayer = null;
        this._id = P.stamp(this);
        // mixin
        this.w = 60;
        this.pre = P.prefix.css + "transform";
        //混入
        P.extend(this, P.base.events);
        this.init(opts);
    }

    Span.prototype = {
        //pre:'transform-origin: 50% 50% 0px; width: 63px; height: 34px; transform: translateZ(0px) translate({x}px, {y}px) translate(-31.5px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px);'
        init : function(opts){
            // this.options = {};
            //alert("init : "+opts)
            P.setOptions(this, opts);
            //position: absolute; z-index: 2001; overflow: visible; cursor: pointer; pointer-events: auto; opacity: 0.8;

            this._el = P.creat("div" , null , "pano-overlay-span", null, "position: absolute; left: 0px; top: 0px;display:block;padding:3px;color:#fff;transform-origin: 50% 50% 0px; height: 34px; "+this.pre+":translate(0px,0px);",{action:opts.action});
            this._contentDiv = P.creat("span",null,"pano-span-content",this._el,"background:#000;padding:3px 5px;");
            this._arrow = P.creat("span",null,"pano-span-arrow",this._el);
            if(this.options.content != "") this.setContent(this.options.content);
            if(this.options.position) this.setPosition(this.options.position);
            if(this.options.pano) this.setPano(this.options.pano);
            this._regListeners();
        },

        _regListeners:function(){
            P.on(this._el,"click",this._onClick,this);
        },

        _onClick : function(e){
            var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
            action = action.split(",");
            //console.log(action)
            if(action[0]=="setPano") this._pano.setPano(action[1]);
            else this._pano.call.apply(this._pano ,action );
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        },


        _moveTo : function(v){

            var l = "translate("+ v.x+"px, "+v.y+"px) translate(-px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px)";
            this._el.style[this.pre] = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate(-"+this.w/2+"px, -20px) rotate(0deg) translate(0px, 0px) scale(1,1) translate(0px, 0px)";
            //console.log(this._el.style[this.pre+"Transform"])
            //this._el.style.left = Math.round(v.x)+"px";
            //this._el.style.top = Math.round(v.y) + "px";

        },

        /*getPano:function(){ return this._pano; },

         getPosition : function(){ return this.options.position;},

         getContent : function(){ return this.options.content},

         getVisible : function()
         {
         return this.options._visiable;
         },
         */
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

        setContent : function( v ){
            this._contentDiv.innerHTML = this.options._content = v;
            this.w = utils.getLength(v);
            this._contentDiv.style.width = this.w+"px";
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
        }

    }
    //factory
    P.span = function(opts){ return new Span(opts);}
    return Span
})