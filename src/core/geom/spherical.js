P.module("P.core.geom.spherical",[],function(){
    return {
        //function (c,d){}
        computeHeading : function(from , to){
            var toRad = Math.PI / 180,toDeg = 180 / Math.PI;
            var e=from.lat * toRad,
                f=to.lat * toRad,
                g=to.lng*toRad - from.lng * toRad;
            var r = (Math.atan2(Math.sin(g)*Math.cos(f),Math.cos(e)*Math.sin(f)-Math.sin(e)*Math.cos(f)*Math.cos(g))) * toDeg;

            if(r<0) r+=360;

            return r;
        },
        //计算方位角
        computeHeading2 : function(from , to){
            var toRad = Math.PI / 180;
            var lat2 = from.lat * toRad,lat1=to.lat* toRad, lon2 = from.lng * toRad , lon1 = to.lng* toRad,
                t1 = Math.sin(lat1) * Math.sin(lat2),
                t2 = Math.cos(lat1) * Math.cos(lat2),
                t3 = Math.cos(lon1 - lon2),
                t4 = t2 * t3,
                t5 = t1 + t4,
                rad_dist = Math.atan(-t5/Math.sqrt(-t5 * t5 +1)) + 2 * Math.atan(1);

            t1 = Math.sin(lat2) - Math.sin(lat1) * Math.cos(rad_dist);
            t2 = Math.cos(lat1) * Math.sin(rad_dist);
            t3 = t1/t2;
            var azimuth;
            if(Math.sin(lon2 - lon1) < 0)
            {
                t4 = Math.atan(-t3 /Math.sqrt(-t3 * t3 + 1)) + 2 * Math.atan(1);
                azimuth = t4;
            }
            else
            {
                t4 = -t3 * t3 + 1;
                t5 = 2 * Math.PI - (Math.atan(-t3 / Math.sqrt(-t3 * t3 + 1)) + 2 * Math.atan(1));
                azimuth = t5;
            }
            return(azimuth * 180 /Math.PI);
        },

        //通过起始点坐标、距离以及方位角算出终点坐标。
        //from:LatLng, distance:Number, azimuth:Number, radius?:Number

        computeOffset : function(from, dist, azimuth,radius) {
            var toRad = Math.PI / 180 , toDeg = 180 / Math.PI;
            var EARTH_RADIUS = 6378137;
            var heading = azimuth * toRad;
            var lat1 = from.lat * toRad;
            var lng1 = from.lng * toRad;
            var dByR = dist / (radius || EARTH_RADIUS);
            var lat = Math.asin(
                    Math.sin(lat1) * Math.cos(dByR) +
                    Math.cos(lat1) * Math.sin(dByR) * Math.cos(heading));
            var lng = lng1 + Math.atan2(
                    Math.sin(heading) * Math.sin(dByR) * Math.cos(lat1),
                    Math.cos(dByR) - Math.sin(lat1) * Math.sin(lat));
            return {lat:lat * toDeg , lng : lng * toDeg};
        },

        computeOffset2 : function(from , dist , heading , radius){
            var toRad = Math.PI / 180 , toDeg = 180 / Math.PI;
            var EARTH_RADIUS = 6378137;
            var d = dist / (radius || EARTH_RADIUS);
            var e = heading * toRad;
            var g = from.lat * toRad;
            var f = Math.cos(d);
            d = Math.sin(d);
            var h = Math.sin(g), g = Math.cos(g), p = f * h + d * g * Math.cos(e);
            return {lat: Math.asin(p) * toDeg, lng:(from.lng * toRad + Math.atan2(d * g * Math.sin(e), f - h * p)) * toDeg }
        }
        ,
        computeDistance : function(p1, p2) {
            var EARTH_RADIUS = 6378137.0 , PI = Math.PI , toRad = Math.PI / 180.0;

            var lat1 = p1.lat * toRad;
            var lat2 = p2.lat * toRad;

            var deltaLon = (p2.lng - p1.lng) * toRad

            return EARTH_RADIUS * Math.acos(
                    Math.sin(lat1) * Math.sin(lat2) +
                    Math.cos(lat1) * Math.cos(lat2) * Math.cos(deltaLon));
        }
    }

})