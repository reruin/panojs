/**
 * 本地场景组
 * */
P.module('P.provider.LocalProvider',['P.base.feature'],function(feature){
    function HQTProvider(opts){
        this.options = {render: "auto", multires: true, type: "cube" , server : "" , server_pois : "" , size : 256 , fov:120 , maxDeep:3 , maxpixelzoom : 1};

        this.sync = true;


        P.setOptions(this, opts);
        this.options.server += "{panoid}/"
        this.options.tiles_tpl = this.options.server + "tiles/cube/";
        this.maxDeep = P.feature.mobile?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;

    }

    HQTProvider.prototype = {

        _parse : function(id){
            return code.decode(id);
        },

        getPanoById : function(id) {
            var o = this._parse(id);
            //console.log(o);
            return {
                "location": {
                    "latLng":{lat: o.lat , lng: o.lng},
                    "description":"",
                    "pano":id
                },
                "copyright": "HQT",
                "imageDate": o.time,
                "links": [/*{
                 "heading": 0,
                 "description": string,
                 "pano": string,
                 "roadColor": string,
                 "roadOpacity": number
                 }*/],
                "tiles": {
                    "worldSize": null,
                    "tileSize": 256,
                    "centerHeading": o.dir,
                    "getTileUrl": P.bind(this.getTile , this)
                }
            }
        }
        ,
        getPanoByLocation:function(){
            return {};
        },

        getThumbById : function(id){
            return P.utils.template(this.options.server , {panoid:id}) +"thumb.jpg";;
        },

        getTile : function(v){

            if(v.z == -1) return P.utils.template(this.options.tiles_tpl , v) +"preview.jpg";


            var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
            v.x += l[v.f] * (1<< v.z);

            return P.utils.template(this.options.tiles_tpl+"{z}/{x},{y}.jpg", v);

        }
    };

    return HQTProvider;
})