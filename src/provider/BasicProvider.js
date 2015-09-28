/**
 * BasicProvider 单一场景
 */

P.module('P.provider.BasicProvider',['P.base.feature','P.base.utils'],function(feature,utils){
    function BasicProvider(opts){
        this.options = {render: "auto" , multires : true , fov:120 , url : "" , getTile : null , size : 512 , onceMode : false , faceurl : false , sync:true};

        this.ready = false;

        this.data = {};

        P.setOptions(this, opts);
        //this._url = this.options.url;
        this.maxDeep = (feature.mobile && this.options.maxDeep>1)?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;
        this.onceMode = this.options.onceMode || (feature.mobile && this.maxDeep<=1);
    }

    BasicProvider.prototype = {

        _creatTileData:function(id){
            return {
                "location": {
                    "latLng":{lat: 0 , lng: 0},
                    "description":"",
                    "pano":id
                },
                "imageDate": "",
                "copyright": "",
                "links": [],
                "tiles": {
                    "worldSize": null,
                    "tileSize": this.options.size,
                    "centerHeading": 0,
                    "getTileUrl": P.bind(this.getTile , this)
                }
            }
        },

        // return PanoTileData;
        getPanoById : function(id) {
            return this.data[id] ? this.data[id].panoData : this._creatTileData(id);
        },

        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id){
            return this.data[id] ? this.data[id].poiData : [];
        },

        getTile: function (v) {

            if(typeof(this.options.getTile) == "function")
            {
                return this.options.getTile(v);
            }else
            {
                if(v == "preview" || v.z == '-1') return this.options.preview;
                else {
                    if(this.options.faceurl == false)
                    {
                        var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                        v.x += l[v.f] * (1<< v.z);
                    }
                    console.log(v)
                    return utils.template(this.options.url, v);
                }
            }
        }
    };

    return BasicProvider;
})