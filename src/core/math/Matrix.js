P.module("P.core.math.Matrix",["P.core.math.Math"],function(math){
    function Matrix(args) {
        //var args = Array.prototype.concat.call(null , arguments);
        if(args == undefined)
            args = [
                1, 0, 0, 0,
                0, 1, 0, 0,
                0, 0, 1, 0,
                0, 0, 0, 1];

        this.n11 = args[0];
        this.n12 = args[1];
        this.n13 = args[2];
        this.n14 = args[3];
        this.n21 = args[4];
        this.n22 = args[5];
        this.n23 = args[6];
        this.n24 = args[7];
        this.n31 = args[8];
        this.n32 = args[9];
        this.n33 = args[10];
        this.n34 = args[11];
        this.n41 = args[12];
        this.n42 = args[13];
        this.n43 = args[14];
        this.n44 = args[15];

    }

    Matrix.prototype = {
        reset : function(){
            this.n11 = this.n22 = this.n33 = this.n44 = 1;
            this.n12 = this.n13 = this.n14 = this.n21
                = this.n23 = this.n24 = this.n31 = this.n32
                = this.n34 = this.n41 = this.n42 = this.n43 = 0;
            return this;
        },

        copy:function(m){
            this.n11 = m.n11;	this.n12 = m.n12;
            this.n13 = m.n13;	this.n14 = m.n14;

            this.n21 = m.n21;	this.n22 = m.n22;
            this.n23 = m.n23;	this.n24 = m.n24;

            this.n31 = m.n31;	this.n32 = m.n32;
            this.n33 = m.n33;	this.n34 = m.n34;

            return this;
        },



        clone:function( )
        {
            return new Matrix
            (
                [
                    this.n11, this.n12, this.n13, this.n14,
                    this.n21, this.n22, this.n23, this.n24,
                    this.n31, this.n32, this.n33, this.n34,
                    this.n41, this.n42, this.n43, this.n44
                ]
            );
        },

        toArray:function(){
            return  [
                this.n11, this.n12, this.n13, this.n14,
                this.n21, this.n22, this.n23, this.n24,
                this.n31, this.n32, this.n33, this.n34,
                this.n41, this.n42, this.n43, this.n44
            ]
        },

        //转置
        transpose : function(){
            return new Matrix
            (
                [
                    this.n11, this.n21, this.n31, this.n41,
                    this.n12, this.n22, this.n32, this.n42,
                    this.n13, this.n23, this.n33, this.n43,
                    this.n14, this.n24, this.n34, this.n44
                ]
            );
        },

        // 逆矩阵
        invert : function(){
            var _temp = new Matrix();
            _temp.copyFrom(this);
            _temp.calculateInverse(this);
            return _temp;
        },

        copyFrom : function(m){
            if(Object.prototype.toString.call(m) === '[object Array]')
            {
                this.n11 = m[0];	this.n12 = m[1];
                this.n13 = m[2];	this.n14 = m[3];

                this.n21 = m[4];	this.n22 = m[5];
                this.n23 = m[6];	this.n24 = m[7];

                this.n31 = m[8];	this.n32 = m[9];
                this.n33 = m[10];	this.n34 = m[11];

                this.n41 = m[12];	this.n42 = m[13];
                this.n43 = m[14];	this.n44 = m[15];
            }else {
                this.n11 = m.n11;
                this.n12 = m.n12;
                this.n13 = m.n13;
                this.n14 = m.n14;

                this.n21 = m.n21;
                this.n22 = m.n22;
                this.n23 = m.n23;
                this.n24 = m.n24;

                this.n31 = m.n31;
                this.n32 = m.n32;
                this.n33 = m.n33;
                this.n34 = m.n34;

                this.n41 = m.n41;
                this.n42 = m.n42;
                this.n43 = m.n43;
                this.n44 = m.n44;
            }
            return this;

        },

        det : function()
        {
            return	(this.n11 * this.n22 - this.n21 * this.n12) * this.n33 - (this.n11 * this.n32 - this.n31 * this.n12) * this.n23 +
                (this.n21 * this.n32 - this.n31 * this.n22) * this.n13;
        },

        calculateInverse : function( m )
        {
            var d = m.det();

            if( Math.abs(d) > 0.001 )
            {
                d = 1/d;

                var m11 = m.n11,  m21 = m.n21,  m31 = m.n31;
                var m12 = m.n12,  m22 = m.n22,  m32 = m.n32;
                var m13 = m.n13,  m23 = m.n23,  m33 = m.n33;
                var m14 = m.n14,  m24 = m.n24,  m34 = m.n34;

                this.n11 =	 d * ( m22 * m33 - m32 * m23 );
                this.n12 =	-d * ( m12 * m33 - m32 * m13 );
                this.n13 =	 d * ( m12 * m23 - m22 * m13 );
                this.n14 =	-d * ( m12 * (m23*m34 - m33*m24) - m22 * (m13*m34 - m33*m14) + m32 * (m13*m24 - m23*m14) );

                this.n21 =	-d * ( m21 * m33 - m31 * m23 );
                this.n22 =	 d * ( m11 * m33 - m31 * m13 );
                this.n23 =	-d* ( m11 * m23 - m21 * m13 );
                this.n24 =	 d * ( m11 * (m23*m34 - m33*m24) - m21 * (m13*m34 - m33*m14) + m31 * (m13*m24 - m23*m14) );

                this.n31 =	 d * ( m21 * m32 - m31 * m22 );
                this.n32 =	-d* ( m11 * m32 - m31 * m12 );
                this.n33 =	 d * ( m11 * m22 - m21 * m12 );
                this.n34 =	-d* ( m11 * (m22*m34 - m32*m24) - m21 * (m12*m34 - m32*m14) + m31 * (m12*m24 - m22*m14) );
            }
        }
    }

    //[4*4] * 右乘列矩阵
    Matrix.multiplyVector = function (v, m) {
        var vx = v.x, vy = v.y, vz = v.z, vw = v.w;// / (vx * m.n41 + vy * m.n42 + vz * m.n43 + 1 * m.n44);

        v.x = vx * m.n11 + vy * m.n12 + vz * m.n13 + vw*m.n14;
        v.y = vx * m.n21 + vy * m.n22 + vz * m.n23 + vw*m.n24;
        v.z = vx * m.n31 + vy * m.n32 + vz * m.n33 + vw*m.n34;
        v.w = vx * m.n41 + vy * m.n42 + vz * m.n43 + vw*m.n44;
        //console.log(v.w+"<===")

        //v.w = 1;
        //v.w = 1/vw;
        return v;
    }


    Matrix.multiplyVector3x3 = function (m, v) {
        var vx = v.x;
        var vy = v.y;
        var vz = v.z;

        v.x = vx * m.n11 + vy * m.n12 + vz * m.n13;
        v.y = vx * m.n21 + vy * m.n22 + vz * m.n23;
        v.z = vx * m.n31 + vy * m.n32 + vz * m.n33;
    }

    Matrix.multiply = function( a, b ){
        var a11 = a.n11,  b11 = b.n11,
            a21 = a.n21,  b21 = b.n21,
            a31 = a.n31,  b31 = b.n31,
            a41 = a.n41,  b41 = b.n41,

            a12 = a.n12,  b12 = b.n12,
            a22 = a.n22,  b22 = b.n22,
            a32 = a.n32,  b32 = b.n32,
            a42 = a.n42,  b42 = b.n42,

            a13 = a.n13,  b13 = b.n13,
            a23 = a.n23,  b23 = b.n23,
            a33 = a.n33,  b33 = b.n33,
            a43 = a.n43,  b43 = b.n43,

            a14 = a.n14,  b14 = b.n14,
            a24 = a.n24,  b24 = b.n24,
            a34 = a.n34,  b34 = b.n34,
            a44 = a.n44,  b44 = b.n44;

        return new Matrix([
                a11*b11 + a12*b21 + a13*b31 + a14*b41, a11*b12 + a12*b22 + a13*b32 + a14*b42, a11*b13 + a12*b23 + a13*b33 + a14*b43, a11*b14 + a12*b24 + a13*b34 + a14*b44,

                a21*b11 + a22*b21 + a23*b31 + a24*b41, a21*b12 + a22*b22 + a23*b32 + a24*b42, a21*b13 + a22*b23 + a23*b33 + a24*b43, a21*b14 + a22*b24 + a23*b34 + a24*b44,

                a31*b11 + a32*b21 + a33*b31 + a34*b41, a31*b12 + a32*b22 + a33*b32 + a34*b42, a31*b13 + a32*b23 + a33*b33 + a34*b43, a31*b14 + a32*b24 + a33*b34 + a34*b44,

                a41*b11 + a42*b21 + a43*b31 + a44*b41, a41*b12 + a42*b22 + a43*b32 + a44*b42, a41*b13 + a42*b23 + a43*b33 + a44*b43, a41*b14 + a42*b24 + a43*b34 + a44*b44
        ]);
    }

    Matrix.euler2matrix = function (deg) {
        //trace("euler2matrix");

        var toRADIANS = math.DEGTORAD;
        var m = new Matrix([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);//;


        var ax = deg.x * toRADIANS;
        var ay = deg.y * toRADIANS;
        var az = deg.z * toRADIANS;

        var a = Math.cos(ax);
        var b = Math.sin(ax);
        var c = Math.cos(ay);
        var d = Math.sin(ay);
        var e = Math.cos(az);
        var f = Math.sin(az);

        var ad = a * d;
        var bd = b * d;

        m.n11 = c * e;
        m.n12 = -c * f;
        m.n13 = d;
        m.n21 = bd * e + a * f;
        m.n22 = -bd * f + a * e;
        m.n23 = -b * c;
        m.n31 = -ad * e + b * f;
        m.n32 = ad * f + b * e;
        m.n33 = a * c;

        return m;
    }

    Matrix.lookAt = function(pos , dir , up){

        var n = pos.sub(dir).normalize();
        var u = up.cross(n).normalize();
        var v = n.cross(u);

        return new Matrix([
            u.x, v.x, n.x, 0,
            u.y, v.y, n.y, 0,
            u.z, v.z, n.z, 0,
            -u.dot(pos),-v.dot(pos),-n.dot(pos),1
        ]);
    }

    Matrix.rotate = function(m, angle, axis) {
        var toRADIANS = math.DEGTORAD;
        var s = Math.sin(angle * toRADIANS);
        var c = Math.cos(angle * toRADIANS);

        var m11 = m.n11,  m21 = m.n21,  m31 = m.n31;
        var m12 = m.n12,  m22 = m.n22,  m32 = m.n32;
        var m13 = m.n13,  m23 = m.n23,  m33 = m.n33;
        var m14 = m.n14,  m24 = m.n24,  m34 = m.n34;
        //tmp.copyFrom(m);
        if ( axis == 'x' ) {

            m.n21 = m21*c + m31*s;
            m.n22 = m22*c + m32*s;
            m.n23 = m23*c + m33*s;
            m.n24 = m24*c + m34*s;

            m.n31 = m21*-s + m31*c;
            m.n32 = m22*-s + m32*c;
            m.n33 = m23*-s + m33*c;
            m.n34 = m24*-s + m34*c;
        }
        if ( axis == 'y' ) {
            m.n11 = m11*c + m31*-s;
            m.n12 = m12*c + m32*-s;
            m.n13 = m13*c + m33*-s;
            m.n14 = m14*c + m34*-s;

            m.n31 = m11*s + m31*c;
            m.n32 = m12*s + m32*c;
            m.n33 = m13*s + m33*c;
            m.n34 = m14*s + m34*c;
        }

        return m;
    }
    return Matrix;
})