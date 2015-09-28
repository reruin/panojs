P.module("P.core.math.Vector3",["P.core.math.Math"],function(math){

    function vector3(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = 1;
    }

    vector3.prototype = {
        toArray:function(){
            return [this.x , this.y , this.z];
        },

        plus: function (v) {
            this.x += v.x;
            this.y += v.y;
            this.z += v.z;
        },

        minus: function (v) {
            this.x -= v.x;
            this.y -= v.y;
            this.z -= v.z;
        },

        multiply: function (v) {
            this.x *= v;
            this.y *= v;
            this.z *= v;
            return this;
        },

        //归一化
        normalize: function () {
            var mod = 1 / this.modulo();
            return this.multiply(mod);

        },

        project : function(){
            var w = this.w;
            this.x /= w; this.y/=w; this.z/=w; this.w = 1;
            return this;
        },
        //
        sub: function (v2) {
            return new vector3(this.x - v2.x, this.y - v2.y, this.z - v2.z);
        },

        add: function (v) {
            return new vector3(this.x + v.x, this.y + v.y, this.z + v.z);
        },
        dot: function (v) {
            return this.x * v.x + this.y * v.y + this.z * v.z;
        },
        //叉乘 得到 法向量
        cross: function (v) {
            return new vector3(this.y * v.z - this.z * v.y, this.z * v.x - this.x * v.z, this.x * v.y - this.y * v.x);
        },

        length: function () {
            return this.modulo();
        },

        modulo: function () {
            return Math.sqrt(this.modulo2());
        },

        modulo2: function () {
            return this.x * this.x + this.y * this.y + this.z * this.z;
        },

        sqrDistToline: function (a, b) {
            var ab = b.sub(a), ac = this.sub(a), bc = this.sub(b);
            var e = ac.dot(ab.normalize());
            var f = ac.length();
            return f * f - e * e;
        },
        clone: function () {
            return new vector3(this.x, this.y, this.z);
        },

        copyFrom : function(v){
            this.x = v.x ; this.y = v.y ; this.z = v.z ; this.w = v.w;
            return this;
        },

        rotate: function (rot) {
            return vector3(this, rot);
        },

        rotateX: function (angle) {
            angle *= math.toRADIANS;
            var cosRY = Math.cos(angle);
            var sinRY = Math.sin(angle);

            var temp = this.clone();

            this.y = (temp.y * cosRY) - (temp.z * sinRY);
            this.z = (temp.y * sinRY) + (temp.z * cosRY);

            /*
             P.math.Matrix.multiplyVector(this , new P.math.Matrix(
             [
             1,  0,      0,      0,
             0,  cosRY,  sinRY,  0,
             0,  -sinRY, cosRY,  0,
             0,  0,      0,      1
             ]
             ));*/
            return this;
        },
        rotateY: function (angle) {
            angle *= math.toRADIANS;
            var cosRY = Math.cos(angle);
            var sinRY = Math.sin(angle);

            var temp = this.clone();

            this.x = (temp.x * cosRY) + (temp.z * sinRY);
            this.z = (temp.x * -sinRY) + (temp.z * cosRY);

            /*
             P.math.Matrix.multiplyVector(this , new P.math.Matrix(
             [
             cosRY,  0,  -sinRY, 0,
             0,      1,  0,      0,
             sinRY,  0,  cosRY,  0,
             0,      0,  0,      1
             ]
             ));*/
            return this;
        },
        // Spherical coord left hand coord
        toSpherical: function ( degree ) {
            /* var r = this.modulo(),
             phi = Math.atan(this.z / this.x),
             theta = Math.acos(this.y / r);*/
            var r = this.modulo(),
                phi = Math.atan2(this.x , this.z),// [-180,180]
                theta = Math.asin(this.y / r); // [90,-90]
            //P.logger("phi=" + phi + ", theta=" + theta + ", r =" + r)
            //theta *= -1;
            if(degree === true) {
                phi *= 180 / Math.PI;
                phi = (phi + 3.6e5)%360;
                theta *= -180 / Math.PI;
                //return new P.math.Vector3(phi , theta , r);
            }
            return new vector3(phi, theta, r);
        },

        toXYZ:function(degree){
            var ox = this.x , oy = this.y , oz = this.z;

            //转换到 [-180,180] [-90,90]

            if(degree === true){
                if(ox > 180) ox -= 360; oy *= -1;

                ox *= Math.PI / 180;
                oy *= Math.PI / 180;
            }
            var r = oz ,
                iy = r * Math.sin(oy),
                ix = r * Math.cos(oy) * Math.sin(ox),
                iz = r * Math.cos(oy) * Math.cos(ox);
            this.x = ix ; this.y = iy ; this.z = iz;
            return this;
        },
        // 向量 是否与 三角形相交 的快速例程，默认向量起始原点，请参照射线与三角形相交 P.geom.Ray.intersectTriangle()
        intersectTriangle: function (v0, v1, v2) {//P.logger(v0)
            if (P.isArray[v0]) {
                v1 = v0[1];
                v2 = v0[2];
                v0 = v0[0];
            }
            //if(P.isArray[v0])

            var e1 = v1.sub(v0),
                e2 = v2.sub(v0),
                p = this.cross(e2),
            // determinant
                det = e1.dot(p),
                T,
                t, u, v;

            if (det > 0) {
                T = vector3.ZERO().sub(v0);
            } else {
                T = v0.sub(vector3.ZERO());
                det = -det;
            }
            // If determinant is near zero, ray lies in plane of triangle
            if (det < 0.0001) return false;
            // Calculate u and make sure u <= 1
            u = T.dot(p);
            if (u < 0 || u > det) return false;

            // Calculate v and make sure u + v <= 1
            var Q = T.cross(e1);
            v = this.dot(Q);

            if (v < 0 || u + v > det) return false;

            // Calculate t, scale parameters, ray intersects triangle
            t = e2.dot(Q);
            var fInvDet = 1 / det;
            t *= fInvDet;
            u *= fInvDet;
            v *= fInvDet;
            //t<0 点存在于 射线反方向
            return t;//this.ori.add( this.normal.multiply( t ) );
        }/*,

         distanceToLine : function(){

         }*/
    }

    vector3.add = function (v1, v2) {
        return new vector3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
    }

    vector3.sub = function (v1, v2) {
        return new vector3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
    }

    vector3.dot = function (v1, v2) {
        return new vector3(v1.x * v2.x, v1.y * v2.y, v1.z * v2.z);
    }

    vector3.multiply = function (v, s) {
        return new vector3(v.x * s, v.y * s, v.z * s );
    }

    vector3.ZERO = function () {
        return new vector3(0, 0, 0);
    }

    vector3.divide = function(v ,s ){ return new vector3(v.x / s, v.y / s, v.z / s);}

    return vector3;

});