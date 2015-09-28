P.module("P.core.geom.Point",[],function(){

    function Point(x, y) {
        this.x = x;
        this.y = y;
    }

    P.point = function (x, y) {
        if (x instanceof Point) {
            return x;
        }
        if (P.isArray(x)) {
            return new Point(x[0], x[1]);
        }
        if (x === undefined || x === null) {
            return x;
        }
        return new Point(x, y);
    };

    Point.prototype = {
        clone: function () {
            return new Point(this.x, this.y);
        },
        add: function (point) {
            return P.point(this.x + point.x, this.y + point.y);
        },
        subtract: function (point) {

            return P.point(this.x - point.x, this.y - point.y);
        },
        interpolate: function (p, v) {
            return new Point(this.x * v + p.x * (1 - v), this.y * v + p.y * (1 - v))
        },

        divide: function (num) {
            this.x /= num;
            this.y /= num;
            return this;
        },

        equals: function (point) {
            point = P.point(point);

            return point.x === this.x && point.y === this.y;
        },
        normalise: function () {
            /*var m = this.modulo;
             this.x = this.x/m;
             this.y = this.y/m;*/
        },

        angle: function () {

        },

        rotate: function (angle, useDEGREES) {
            useDEGREES = useDEGREES !== true ? false : true;

            if (useDEGREES) angle *= math.DEGTORAD;
            var cosRY = Math.cos(angle),
                sinRY = Math.sin(angle),
                temp = this.clone();


            this.x = (temp.x * cosRY) - (temp.y * sinRY);
            this.y = (temp.x * sinRY) + (temp.y * cosRY);
        },

        distanceTo: function (point) {
            point = P.point(point);

            var x = point.x - this.x,
                y = point.y - this.y;

            return Math.sqrt(x * x + y * y);
        },
        contains: function (point) {
            point = P.point(point);

            return Math.abs(point.x) <= Math.abs(this.x) &&
                Math.abs(point.y) <= Math.abs(this.y);
        },
        toString: function () {

        }
    }
    return Point;
})