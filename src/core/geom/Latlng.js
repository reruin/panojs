P.module("P.core.geom.Latlng",[],function(){
    function latlng(lat , lng){ this.lat = lat || 0.0; this.lng = lng || 0.0; }

    latlng.prototype = {
        toMercator: function () {
            var pole = 20037508.34 ,
                ix = this.lng * pole / 180 ,
                iy = Math.log(Math.tan((90 + this.lat) * Math.PI / 360)) / Math.PI * pole;
            return new latlng(ix, iy);
        },
        getLat: function () {
            return this.lat;
        },
        getLng: function () {
            return this.lng;
        },
        toString: function () {
            return ("lng=" + this.lng + ",lat=" + this.lat);
        },
        toUrlValue: function () {
            return (this.lat + "," + this.lng);
        },
        clone: function () {
            return new P.geom.Latlng(this.lat, this.lng, this.noWrap);
        },
        equals: function (ll) {
            var equals = false;
            if (ll != null) {
                equals = ((this.lng == ll.lng && this.lat == ll.lat) ||
                    (isNaN(this.lng) && isNaN(this.lat) && isNaN(ll.lng) && isNaN(ll.lat)));
            }
            return equals;
        },
        distanceTo: function (p) {
            //标准球体 计算
            var EARTH_RADIUS = 6378137.0 , PI = Math.PI
                , toRad = Math.PI / 180.0;

            var lat1 = this.lat , lng1 = this.lng , lat2 = p.lat , lng2 = p.lng;
            lat1 = lat1 * toRad;
            lat2 = lat2 * toRad;

            var a = lat1 - lat2;
            var b = lng1 * toRad - lng2 * toRad;

            var s = 2 * Math.asin(Math.sqrt(Math.pow(Math.sin(a / 2), 2) + Math.cos(lat1) * Math.cos(lat2) * Math.pow(Math.sin(b / 2), 2)));
            s = s * EARTH_RADIUS;
            s = Math.round(s * 10000) / 10000.0;
            return s;
        }
    }

    return latlng;
})