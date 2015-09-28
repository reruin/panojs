/**
 * Created by Administrator on 2014/11/7.
 */
P.module("P.base.services",["P.base.utils"],function(utils){

    var dataConvert = function(d){
        var scene = [];
        d = d.detail.scenes;
        for(var i=0;i< d.length;i++){
            scene[i] = {
                "id" : d[i].svid,
                "title" : d[i].name,
                "link":[],
                "pois":[],
                "lat":utils.proj.latFromProjTo4326(d[i].y),
                "lng":utils.proj.lngFromProjTo4326(d[i].x),
                "dir":d[i].dir
            }
        }

        //console.log(scene)

        return scene;
        /* return {"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene};*/

        /* {"dir":53,"name":"正门","pitch":0,"svid":"100930Y7140123100324950","x":13378176.470000,"y":3531281.830000,"zoom":1}*/
        /*    {"id": "414031730217098120174100000", "title": "正门", "link": [], "pois": [
         {"type": "bank", position: "30,90", "title": "兴趣点1"}
         ]}*/

    }

    var getQQScene = function(scenic_id , cb){
        utils.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d){
            cb( dataConvert(d) );
        });
    }

    var getQQData = function(v , cb){
        P.jsonp("http://sv.map.qq.com/sv?pf=html5&svid="+v+"&ch=&output=jsonp&cb=?" , function(d){
            var owner = "Tencent SteetView",
                description = d.detail.basic.scenic_name,
                basic =  {"tileSize": 256, "level": 1, "type": "cube",onceMode:true, ignoneLv0:true},
                scene = [];
            var provider = {"id":"Tencent",link:"http://map.qq.com",title:description};
            var md = d.detail.building.floors;
            var sid = d.detail.building.group_id;
            for(var i=0;i<md.length;i++)
            {
                scene[i] = {"id":sid+"-"+(i+1),"title":md[i].name,"pano":[] , "sync":false}
            }

            var start = 0;
            function loadSceneData(){
                var scenic_id = sid+"-"+(start+1);
                P.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d2){
                    scene[start].pano = dataConvert(d2);
                    start++;
                    if(start < scene.length) setTimeout(loadSceneData,10);
                    else  cb({"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene});
                });
            }


            loadSceneData();

            //cb({"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene});
            /*var scenic_id = d.detail.basic.scenic_id;
             P.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d1){
             cb( P.Utils.dataConvert(d1 , d) );
             });
             */
        })
    }

    var getQQ
    var QQ2HQT = function(id , cb){
        P.jsonp("http://sv0.map.qq.com/sv?pf=html5&svid="+id+"&ch=&output=jsonp&cb=?&token="+new Date().getTime(),function(d){
            var dir = parseInt(d.detail.basic.dir);
            var lat= d.detail.addr.y_lat , lng = d.detail.addr.x_lng;
            var time = "20"+id.substring(8,10)+"-"+id.substring(10,12) + "-01";
            console.log({time:time,lat:lat,lng:lng,alt:0,dir:dir});
            console.log(utils.code.encode({time:time,lat:lat,lng:lng,alt:0,dir:dir} , true));
        })
    }

    var geoCoder = function(v , cb , key){
        // 通用uri,有IP限制
        var url = "http://sv.map.qq.com/rarp?lat="+ v.lat+"&lng="+ v.lng+"&output=jsonp&cb=?";

        //标准接口 参考 QQ Map API
        if(key) url = "http://apis.map.qq.com/ws/geocoder/v1/?output=jsonp&location="+ v.lat+","+v.lng+"&key="+key+"&get_poi=0&cb=?";


        P.jsonp(url , function(d) {
            var ars = "";
            if (key == undefined) {
                if (d.info.errno == 0) {
                    ars = d.detail.AD;
                }
            }else
            {
                if(d.status == 0)
                {
                    ars = d.result.address;
                }
            }
            cb(ars);

        });
    }

    var getCommentFromQQ = function(id , cb){
        P.jsonp("http://routes.map.qq.com/?qt=rich&pid="+id+"&output=jsonp&cb=?",function(data){
            var reviews = [];
            var comment = data.detail.comments.comment_info;

            for(var i=0;i<comment.length;i++)
            {
                var d = comment[i];
                reviews[i] = {
                    review_id: (d.comment_detail_url.match(/review\/(\d+)/) || [0, -1])[1],
                    user_nickname: d.comment_user,
                    created_time: d.comment_time,
                    text_excerpt: d.comment_content,
                    rating_img_url: "http://i3.dpfile.com/s/i/app/api/32_0star.png",
                    rating_s_img_url: "http://i2.dpfile.com/s/i/app/api/16_0star.png",
                    "product_rating": 3,
                    "decoration_rating": 4,
                    "service_rating": 3,
                    "review_url": d.comment_detail_url
                };

            }
            var all = {
                "status": "OK",
                "count":data.detail.comments.comment_num,
                "reviews":reviews,
                "additional_info" : {
                    "more_reviews_url": data.detail.comments.rich_source_url
                }
            }

            cb && cb(all);

        })

    }

    return {
        getQQScene:getQQScene,
        getQQData:getQQData,
        QQ2HQT:QQ2HQT,
        geoCoder:geoCoder,
        getCommentFromQQ:getCommentFromQQ
    }

});