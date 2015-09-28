/**
 * 本地场景组
 * */
P.module('P.provider.LocalProvider',['P.base.feature','P.base.code'],function(feature,code){
    function LocalProvider(opts){
        P.setOptions(this,opts);
        this.options = {render: "auto" , multires : true , fov:120 , tiles_tpl : "" , getTile : null , size : 256 , onceMode : false , faceurl : false , maxpixelzoom:1 , ignoneLv0:false};

        this.ready = false;

        this.data = {};

        P.setOptions(this, opts);
        //this._url = this.options.url;
        this.maxDeep = (feature.mobile && this.options.maxDeep>1)?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;
        this.onceMode = this.options.onceMode || (feature.mobile && this.maxDeep<=1);

        this.renderPreview = this.options.renderPreview === true ? true : false;
        //this.displayPoi =  this.options.displayPoi === true ? true : false;
        //本地数据

        if(this.options.data) this.localParse(this.options.data);
    }

    LocalProvider.prototype = {

        localParse:function(d){
            var data = {} , id , pano , copyright = d.owner;
            //console.log( copyright)

            for(var i=0;i<d.scene.length;i++)
            {
                pano = d.scene[i].pano;
                for(var j=0;j< pano.length;j++)
                {
                    id = pano[j].id;

                    data[id] = { panoData:this.localCreatPanoData(pano[j],copyright), poiData: pano[j].pois , raw: pano[j]}
                }
            }
            this.data = data;
        },

        localCreatPanoData:function(data,copyright){
            var id = data.id,
                title = data.title,
                links = data.links;

            var d = {};
            title = title || "";
            links = links || [];
            copyright = copyright || "";
            var getTile = function(){return ""};



            if(id.length == 27) {
                getTile = P.provider.ResProvider["HQT"].getTile;
                d = code.decode(id);
            }
            else if(id.length == 23) {
                getTile = P.provider.ResProvider["QQ"].getTile;

                d.lat = (data.lat !== undefined) ? data.lat : 0;

                d.lng = (data.lng !== undefined) ? data.lng : 0;

                d.time = "20"+id.substring(8,10)+"-"+id.substring(10,12);

                d.dir = (data.dir !== undefined) ? data.dir : 0;
            }else{
                getTile = P.provider.ResProvider["COMMON"].getTile;

                d.lat = 0;

                d.lng = 0;

                d.time = "1970-01-01";

                d.dir = 0;
            }

            //console.log(d);
            return {
                "location": {
                    "latLng":{lat: d.lat , lng: d.lng},
                    "description":title,
                    "pano":id
                },
                "imageDate": d.time,
                "copyright": copyright,
                "links": links/*[{
                 "heading": 0,
                 "description": string,
                 "pano": string,
                 "roadColor": string,
                 "roadOpacity": number
                 }]*/,
                "tiles": {
                    "worldSize": null,
                    "tileSize": this.options.size,
                    "centerHeading": d.dir,
                    "getTileUrl": getTile
                }
            }
        },

        // return PanoTileData;
        getPanoById : function(id) {
            return this.data[id] ? this.data[id].panoData : this.localCreatPanoData(id);
        },

        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id){
            return this.data[id] ? this.data[id].poiData : [];
        },

        getThumbById : function(id){
            if(id.length == 27) return P.provider.ResProvider["HQT"].getThumb(id);
            else if(id.length == 23) return P.provider.ResProvider["QQ"].getThumb(id);
            else return P.provider.ResProvider["COMMON"].getThumb(id);
        }
    };

    return LocalProvider;
})