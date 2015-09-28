P.module("P.overlays.Icon",[
    'P.core.geom.Latlng',
    "P.overlays.Overlay",
    "P.base.utils"
],function(Latlng,Overlay,utils){
    var Icon = function(opts){
        this.options = {size:[64,128],position : new Latlng() , content : "", visible:true, pano : null , type : "icon" ,local : true};
        P.setOptions(this, opts);
        this._id = utils.stamp(this);
        this.init();

    }
    Icon.prototype = new Overlay();

    Icon.prototype.constructor = Icon;

    Icon.prototype.init = function(){
        var w = this.options.size[0];
        var h = this.options.size[1];

        this._el = P.creat("div" , null , "pano-overlay-icon", null, "position: absolute; left: 0px; top: 0px;display:block;padding:0px;color:#fff;transform-origin: 50% 50%; "+this.pre+":translate(0px,0px);",{action:this.options.action});
        // top : left;
        //this._el = P.creat("div" , null , "pano-overlay-icon", null, "position: absolute; left: 0px; top: 0px;display:block;padding:0px;",{action:opts.action});
        this._contentDiv = P.creat("div",null,"pano-icon-content",this._el,"background:url("+this.options.image+");width:"+w+"px;height:"+h+"px;position:absolute;top:"+(-h)+"px;left:"+(-w/2)+"px");

        if(this.options.position) this.setPosition(this.options.position);

        if(this.options.pano) this.setPano(this.options.pano);

        this._regListeners();
    }

    Icon.prototype._regListeners = function(){
        P.on(this._contentDiv,"click",this._onClick,this);
    }

    Icon.prototype._onClick = function(e){
        var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
        action = action.split(",");

        if(action[0]=="setPano") this._pano.setPano(action[1]);
        else this._pano.get.apply(this._pano ,action );
    }

    P.icon = function(opts){ return new P.overlays.Icon(opts);}

    return Icon;
});

