P.module('P.provider.Provider',['P.base.utils'],function(utils){
    function provider(){

    }

    provider.prototype = {

        sync : true ,

        getPanoById : function(){

        },

        getPanoByLocation:function(){

        },

        getPoiById : function(){},

        getThumbById : function(){}
    };

    P.provider.ResProvider = {
        "COMMON" : {
            getTile : function(v){
                var server = "pano/{panoid}/";
                var tiles_tpl = server + "tiles/cube/";
                if(v.z == -1) return utils.template(tiles_tpl , v) +"preview.jpg";

                var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                v.x += l[v.f] * (1<< v.z);

                return utils.template(tiles_tpl+"{z}/{x},{y}.jpg", v);
            },
            getThumb : function(id){
                var server = "pano/{panoid}/";
                return utils.template(server , {panoid:id}) +"thumb.jpg";
            }
        },
        "HQT":{
            getTile:function(v){
                var server = "pano/{panoid}/";
                var tiles_tpl = server + "tiles/cube/";

                if(v.z == -1) return utils.template(tiles_tpl , v) +"preview.jpg";

                var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                v.x += l[v.f] * (1<< v.z);

                return utils.template(tiles_tpl+"{z}/{x},{y}.jpg", v);
            },
            getThumb : function(id){
                var server = "pano/{panoid}/";
                return utils.template(server , {panoid:id}) +"thumb.jpg";
            }
        },
        "QQ":{
            getTile : function(o){

                var _tpl = "http://sv{r7}.map.qq.com/tile?svid={panoid}&x={x}&y={y}&level={z}&mtype=mobile-cube&from=web";

                var _pre = "http://sv0.map.qq.com/thumb?svid={panoid}&x=0&y=0&level=0&mtype=mobile-cube";

                var _poi ="http://sv.map.soso.com/poi3d?x={lng}&y={lat}&source=qq&type=street&output=jsonp&cb=?&token="+new Date().getTime();

                if(o.z == '-1'){
                    console.log( o )
                }
                if(o.z == -1) return utils.template(_pre , o);

                var iz = o.z; o.z = o.z - 1;
                var num = 1 << iz;

                //qq级别-1;
                var z = o.z;
                var l = {f:0 , r:1 , b:2 , l:3 , u:4, d:5};
                o.x = l[o.f]*num + o.x;
                o.r7 = l[o.f];//Math.floor(Math.random() * 7);

                delete o.f;
                return utils.template( _tpl , o);
            }
            ,
            getThumb:function(id){
                return "http://capture.map.qq.com/screenshot?model=web&from=qqmap&zoom=0&fov=60&width=188&height=106&pano="+id+"&pitch=0&heading=0";
            }
        }
    }

    return provider;
})