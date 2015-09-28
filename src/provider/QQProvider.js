/**
 * QQ StreetView Provider
 * cube方式，6x1 展开，提供两级，瓦片大小256x256
 * 暂时 支持 mobile 小分辨率
 * 暂不 支持 多分辨率
 *
 * */

P.module('P.provider.QQProvider',[
    'P.provider.Provider',
    'P.base.feature'
 ],function(feature){
    function QQProvider(opts){
        P.setOptions(this, opts);
        //this.options.svid =
        //this.options.tiles_tpl = this.options.server;
        this.maxDeep = feature.mobile?1:this.options.maxDeep;
        this.minDeep = 1;
        this.maxZoom = 1<<this.maxDeep;
        this.key = this.options.key;
        this.multires  = true;
        if(this.key == undefined) {alert("QQProvider 需要提供开发者密钥！否则部分功能将失效.");}
        //this.svid = this.options.svid;

    }

    QQProvider.prototype = {

        options: {render: "auto", multires: true, type: "cube" , server : "" , server_pois : "" , size : 256 , fov:120 , maxDeep:2 , maxpixelzoom : 1 , ignoneLv0:true},

        sync : false,

        //svid:"",

        cfgpath: "http://sv.map.qq.com/sv?pf=html5&svid={panoid}&ch=&output=jsonp&cb=?&token="+new Date().getTime(),
        //proxy.asp?uri=
        _tpl: "http://sv{r7}.map.qq.com/tile?svid={panoid}&x={x}&y={y}&level={z}&mtype=mobile-cube&from=web",

        _pre: "http://sv0.map.qq.com/thumb?svid={panoid}&x=0&y=0&level=0&mtype=mobile-cube",

        _poi :"http://sv.map.soso.com/poi3d?x={lng}&y={lat}&source=qq&type=street&output=jsonp&cb=?&token="+new Date().getTime(),


        _parse : function(fn , d){
            //console.log(d)
            var dir = parseInt(d.detail.basic.dir);
            var pos = {lat:d.detail.addr.y_lat , lng:d.detail.addr.x_lng};
            var id = d.detail.basic.svid;
            var copyright = d.detail.basic.source;
            //L(d.detail.addr.y_lat,pos.lng);
            //console.log(pos)
            this._curpos = pos;
            //this._curpos = pos;
            //alert(pos.lat)
            //区域列表，qq默认是 building 作为大区域，floor 作为切换的子区域，
            //this.floors = d.detail.building.floors;
            // 相关所有场景 ,如果是室外 表示当前道路 可以到达区域
            this.scene = d.detail.all_scenes;

            fn({
                "location": {
                    "latLng":pos,
                    "description":"",
                    "pano":id
                },
                "copyright": "Tencent",
                "imageDate" : "20"+id.substring(8,10)+"-"+id.substring(10,12),
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
                    "centerHeading": dir,
                    "getTileUrl": P.bind(P.provider.ResProvider.QQ.getTile , this)
                }
            });

        },

        _cates : {"房产小区":"building" , "娱乐休闲":"leisure", "美食":"food", "购物":"shopping", "生活服务":"service", "医疗保健":"aid","酒店宾馆":"hotel" , "教育学校":"building", "旅游景点":"building" , "文化广场":"building", "停车场":"parking","汽车":"", "银行金融":"bank", "电影院":"", "机构团体":""},

        _parseType : function(v){

            return this._cates[v];
        },


        _parsePoi : function(fn , data){
            data = data.detail.pois;
            var pois = [];
            for(var i=0;i<data.length;i++){
                pois[i] = {
                    position :  P.projection.EPSG3785To4326({lat : data[i].y , lng : data[i].x}),
                    content :  data[i].name,
                    altitude :   data[i].h,
                    id : data[i].uid,
                    type : this._parseType(data[i].catalog)
                }
            }

            fn(pois);
        },

        getPanoById : function(id , fn) {

            P.jsonp(this.cfgpath.replace("{panoid}", id), P.bind( this._parse , this , fn));

        }
        ,
        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id, fn){
            // P.jsonp(this.cfgpath.replace("{panoid}", id), P.bind( this._parse , this , fn));
            var p = P.projection.EPSG4326To3785( this._curpos );

            P.jsonp(P.utils.template(this._poi, p) , P.bind(this._parsePoi , this , fn));
        },

        getThumbById : function(id){
            return "http://capture.map.qq.com/screenshot?model=web&from=qqmap&zoom=0&fov=60&width=188&height=106&pano="+id+"&pitch=0&heading=0"
        },

        getTile:function(o){

        }
    };

    return QQProvider;
})