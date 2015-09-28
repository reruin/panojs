P.module("P.base.code",[],function(){
    return {

        decode: function (v , num) {
            var formatTime = function(v){
                if(v.length==6)
                    return "20"+v.substring(0, 2)+"-"+v.substring(2, 4) + "-" + v.substring(4, 6);

                var y = v.substring(0, 4) , mo = v.substring(4, 6) , d = v.substring(6, 8)
                    , h = v.substring(8, 10) , m = v.substring(10,12);
                return y+"-"+mo+"-"+d+" "+h+":"+m;
            };

            var fix = function (o, n) {
                var l = o.length;
                if (l < n) o = new Array(n - l + 1).join("0") + o;
                return o
            }

            // 27位短编码

            var pre1 = fix(parseInt(v.substring(0, 1)).toString(2) , 3);

            var use_pre = pre1.charAt(0) == "0" ? false : true;
            var lat_pre = pre1.charAt(1) == "0" ? false : true;
            var lng_pre = pre1.charAt(2) == "0" ? false : true;


            var time, lat, lng, dir, indent;

            if(v.length == 38)
            {
                var pre2 = fix(parseInt(v.substring(1, 2)).toString(2) , 3);
                var ident = "";
                var time_pre = pre2.charAt(0) == "0" ? false : true;
                var ident_pre = pre2.charAt(1) == "0" ? false : true;
                time = (time_pre?"bc ":"")+formatTime(v.substring(2, 14));
                lat = parseFloat( v.substring(14, 22) ) / 1e6;
                lng = parseFloat( v.substring(22, 31) ) / 1e6;
                dir = parseInt(v.substring(31,34));
                if(lat_pre) lat *= -1;
                if(lng_pre) lng *= -1;
                // alert(ident_pre)
                if(ident_pre)
                {

                    ident = v.substring(34, 38);
                }

                return {time: time, lat: lat, lng: lng, dir: dir , copyright : ident}
            }

            if(v.length == 27)
            {
                time = formatTime(v.substring(1,7));
                lat = parseFloat( v.substring(7,15) ) / 1e6;
                lng = parseFloat( v.substring(15,24) ) / 1e6;
                dir = parseInt(v.substring(24,27));
                if(lat_pre) lat *= -1;
                if(lng_pre) lng *= -1;

                return {time: time, lat: lat, lng: lng, dir: dir , copyright : ""}
            }


        }//decode("52qgg7ycyUocyUFvkq_")
        ,
        encode: function (v , short) {
            v = v || {};
            var fix = function (o, n) {
                var l = o.length;
                if (l < n) o = new Array(n - l+1).join("0") + o;
                return o
            }

            var fix_0 = function(v){ return (v<10)?("0"+v):(""+v); }
            //alert(fix_0(0))
            var ts = new Date(v.time.replace(/bc\s+/i, ""));
            var time = ts.getFullYear() + fix_0( ts.getMonth()+1) + fix_0(ts.getDate()) + fix_0(ts.getHours()) + (fix_0(ts.getMinutes())),
                lat = Math.floor(v.lat * 1e6) ,
                lng = Math.floor(v.lng * 1e6) ,
                dir = fix(v.dir+"",3),
                alt = fix(v.alt+"",4),
                ident = v.ident || ""; // 5

            //alert(v.ident === undefined)
            // BC Time
            var time_pre = (/bc/i.test(v.time) ? 1 : 0 );
            var lat_pre = lat < 0 ? 1 : 0;
            var lng_pre = lng < 0 ? 1 : 0;
            lat = fix(""+Math.abs(lat),8) ; lng = fix(""+Math.abs(lng),9);
            var use_pre = v.m === true ? 0 :1;
            var ident_pre = v.ident === undefined ? 0 : 1;
            var pre1 = parseInt([use_pre, lat_pre , lng_pre].join("") , 2).toString(10);
            var pre2 = parseInt([time_pre ,ident_pre,0].join(""),2).toString(10);
            if(short === true) {

                time = time.substring(2,8);//console.log("" + lat)
                return "" + pre1 + time + lat + lng + dir;
            }
            return "" + pre1 + pre2 + time + lat + lng + dir + ident;


        }//;console.log(encode({time:"2013-01-01 00:00",lat:-34.123456,lng:-114.123456,alt:-1312,dir:90}))

    };
})