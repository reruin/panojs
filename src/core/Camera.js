P.module("P.core.Camera",[
    "P.core.math.Math",
    'P.core.math.Matrix',
    'P.core.math.Vector3',
    'P.base.utils'
],function(math,Matrix,Vector3,utils){
    //console.log(P);
    //console.log(Matrix);
    /*
     fieldOfView：55
     perspectiveCenter：stagewidth/2, stageHeight/2
     focalLength：stageWidth/ 2 * ( cos(fieldOfView/2) / sin(fieldOfView/2) )
     */
    //viewport 初始
    function Camera(fovtype){
        this._vp = [
            new Vector3(-1, 1, 1),
            new Vector3(1, 1, 1),
            new Vector3(1, -1, 1),
            new Vector3(-1, -1, 1)
        ];

        this._vp_prj = [
            new Vector3(-1, 1, 1),
            new Vector3(1, 1, 1),
            new Vector3(1, -1, 1),
            new Vector3(-1, -1, 1)
        ];

        this._fovtype = fovtype || "mfov";
    }

    Camera.prototype = {
        near: 0.1,

        far: 10000,

        fov: 120,

        _hfov: 1, _vfov: 1, _bfov: 1,

        _vp: [],

        // viewport  旋转
        _vp_r: [],

        //_vp_t : [],
        _rx: 0, _ry: 0,

        _fovtype: "mfov",

        //相机旋转矩阵
        _viewmat: new Matrix(),

        //视图矩阵
        _viewMat: new Matrix(),

        //投影矩阵
        _perspMat: new Matrix(),

        //矩阵合并
        _projMat: new Matrix(),

        _wowrot: new Matrix(),

        // 相机坐标 到 屏幕坐标
        _screenmat: new Matrix(),

        _vp_prj: [],

        _focus: 256,

        BEHIND: 0,


        update: function (vw, vh, fov) {
            this._vw = vw;
            vw /= 2;
            this._vh = vh;
            vh /= 2;

            this._vp[0].x = this._vp[3].x = -vw;
            this._vp[1].x = this._vp[2].x = vw;
            this._vp[0].y = this._vp[1].y = vh;
            this._vp[2].y = this._vp[3].y = -vh;
            this._screenmat.copyFrom([
                vw, 0, 0, 0,

                0, -vh, 0, 0,

                0, 0, 1, 0,

                vw, vh, 0, 1
            ]);

            if (fov != undefined) {

                //动态fov
                this.fov = fov;

                var r = vh / vw;
                if (this._fovtype == "mfov") {

                    if (r > 0.75) r = 0.75;

                    this._hfov = Math.atan(0.75 / r * Math.tan(fov * Math.PI / 360)) * 360 / Math.PI;

                    this._vfov = Math.atan(r * Math.tan(fov * Math.PI / 360)) * 360 / Math.PI;

                    this._bfov = this._vfov;


                }

                else if (this._fovtype == "vfov") {
                    //this._bfov = Math.atan( vw)
                    this._hfov = Math.atan(1 / r * Math.tan(fov * Math.PI / 360)) * 360 / Math.PI;

                    this._vfov = fov;//Math.atan(vw  /  this._vh ) * 360 / Math.PI;

                    this._bfov = this._vfov;

                    //this._focus = vh / Math.tan(this._bfov / 2);
                }

                else if (this._fovtype == "hfov") {
                    //this._bfov = Math.atan( vw)
                    this._hfov = fov;//Math.atan(vw  /  this._vh ) * 360 / Math.PI;

                    this._vfov = Math.atan(r * Math.tan(fov * Math.PI / 360)) * 360 / Math.PI;

                    this._bfov = this._vfov;

                    //this._focus = vh / Math.tan(this._bfov / 2);
                }

                this._focus = vh / Math.tan(this._bfov * Math.PI / 360);

                this._vp[0].z = this._vp[1].z = this._vp[2].z = this._vp[3].z = this._focus;

                this._updatePerspMat();

                this._updateProjMat();
            }

        },

        _getFovByFocus: function (f) {

            var vh = this._vh, vw = this._vw;

            var r = vh / vw;

            var bfov = Math.atan(vh / f) * 360 / Math.PI;
            //alert(vh)
            //if(r>0.75) r = 0.75;

            var fov = Math.atan(Math.tan(bfov * Math.PI / 360) / r) * 360 / Math.PI;

            return fov;

        },

        //平面tile计算特例
        //规范化实际大小 4,1
        getTilesFor2D: function (size, deep) {
            var all = [];
            // world [0,0] [size*4 , size]  [0,0]->[4,1]
            var f = this._focus;

            //
            //var scale = f / size;


            //视野宽高，已经考虑了zoom,转换到 1,4
            var vw = this._vw / f, vh = this._vh / f;
            //瓦片大小
            //console.log(this._ry+"<<<<<");
            //视点位置
            //console.log(tx+","+ty);
            var tx = this._ry / 360, ty = ( 90 + this._rx) / 180 //[0,1];
            for (var i = 1; i <= deep; i++)
                all = all.concat(this.getTilesFor2DByLevel(tx, ty, vw, vh, i, size));
            return all;
        },

        getPovFor2D: function (p) {
            var f = this._focus;//alert(f)

/*          var ix = (0 - p.x ) / (f * 4) / 2; // 1+1+1+1
            var iy = (0 - p.y) / (f * 2) / 2; // 1 + 0.5 + 0.5*/
             var ix = (0 - p.x ) / f / 8; // 1+1+1+1
             var iy = (0 - p.y) / f / 4; // 1 + 0.5 + 0.5
            //console.log(ix+","+iy)
            return {pitch: iy * 180, heading: ix * 360}

        },
        getViewportFor2D: function (size) {

            if (this._vw == undefined || this._vh == undefined) return [0, 0];
            var f = this._focus;//f=256

            //防止中间级别

            var vw = this._vw / f, vh = this._vh / f;
            //console.log("===>"+[vw , vh])
            return [vw, vh];


        },

        getTilesFor2DByLevel: function (tx, ty, vw, vh, lv, size) {

            var res = [];
            //标准化瓦片大小

            var t = 1 << lv, s = 1 / t;
            var w = 4, h = 1;

            // 视野的归一化bound [4,1]
            tx = tx * 4;
            var minx = tx - vw * 0.5, maxx = tx + vw * 0.5, miny = ty - vh * 0.5, maxy = ty + vh * 0.5;


            //[-tx,-ty] , [ vw - tx , vh - ty];
            minx = Math.floor(minx / s);
            maxx = Math.floor(maxx / s),
                miny = Math.floor(miny / s);
            maxy = Math.floor(maxy / s);

            for (var i = minx; i <= maxx; i++) {
                //res[i] = [];
                for (var j = miny; j <= maxy; j++) {
                    // res[i][j] = [i+lx , j+
                    if (j >= 0 && j < t) res.push([i, j, lv])
                }
            }
            return res;
        },

        rotate: function (heading, pitch) {
            this._ry = heading;
            this._rx = pitch;

            //console.log(this._ry)
            //相对于 惯性坐标系 等效相机反向旋转
            //视图坐标
            this._viewmat = Matrix.euler2matrix({x: -this._rx, y: -this._ry, z: 0});

            //this._viewMat = Matrix.euler2matrix({x: this._rx, y: this._ry, z: 0});

            Matrix.rotate(this._viewMat.reset(), -this._rx, "x");
            Matrix.rotate(this._viewMat, -this._ry, "y");

            this._modmat = Matrix.euler2matrix({x: this._rx, y: this._ry, z: 0});

            //this._viewmat.n41 = this._viewmat.n42 = 2;
            this._wowrot = this._viewmat.transpose();

            this._updateProjMat();
        },

        //判断矩形相交http://blog.csdn.net/zyxlsh/article/details/5937191
        // 三角形空间 相交 快速算法 ： http://blog.csdn.net/fourierFeng/article/details/11969915

        // 检测点是否在 视野内
        intersect: function (v) {

            var np = this._vp;
            var rpoint = v.clone();

            //对v应用 旋转矩阵
            Matrix.multiplyVector3x3(this._viewmat, rpoint);
            //P.logger(np[0]);
            //P.logger("calc :");P.logger(v);
            var c1 = rpoint.intersectTriangle(np[0], np[1], np[2]);

            if (c1 === false) {
                c1 = rpoint.intersectTriangle(np[0], np[2], np[3]);
            }
            //P.logger(" cross ===>" + c1)
            //P.logger(rpoint)
            return c1;//(c1!==false && c1>=0);
        },

        /*
         * 检测 squara 面 是否在视野内，参数为 squara 的四个顶点。
         * 检测方式：。
         * 1.通过 near far 快速过滤
         * 2.与视野相交检测
         * */
        intersectSquare: function (v0, v1, v2, v3) {
            if (utils.isArray(v0)) {
                v1 = v0[1];
                v2 = v0[2];
                v3 = v0[3];
                v0 = v0[0];
            }
            return this.inFrustum([v0, v1, v2, v3]) >= 0;
        },


        // 深度剔除
        deepCull: function () {

        },

        clip: function (subjectPolygon) {
            var clipPolygon = {};
            var cp1, cp2, s, e, i, j;
            var inside = function (p) {
                return (cp2.x - cp1.x) * (p.y - cp1.y) > (cp2.y - cp1.y) * (p.x - cp1.x);
            };
            var intersection = function () {
                var dc = {x: cp1.x - cp2.x, y: cp1.y - cp2.y},
                    dp = {x: s.x - e.x, y: s.y - e.y},
                    n1 = cp1.x * cp2.y - cp1.y * cp2.x,
                    n2 = s.x * e.y - s.y * e.x,
                    n3 = 1.0 / (dc.x * dp.y - dc.y * dp.x);
                return {x: (n1 * dp.x - n2 * dc.x) * n3, y: (n1 * dp.y - n2 * dc.y) * n3};
            };
            var outputList = subjectPolygon;
            cp1 = clipPolygon[clipPolygon.length - 1];
            for (j = 0; j < clipPolygon.length; j++) {
                cp2 = clipPolygon[j];
                var inputList = outputList;
                outputList = [];
                s = inputList[inputList.length - 1]; //last on the input list
                for (i = 0; i < inputList.length; i++) {
                    var e = inputList[i];
                    if (inside(e)) {
                        if (!inside(s)) {
                            outputList.push(intersection());
                        }
                        outputList.push(e);
                    }
                    else if (inside(s)) {
                        outputList.push(intersection());
                    }
                    s = e;
                }
                cp1 = cp2;
            }
            return outputList
        },
        //获取点的 相机空间坐标
        cameraProject: function (v) {

            var rpoint = v.clone();
            //对v应用 旋转矩阵
            Matrix.multiplyVector3x3(this._viewmat, rpoint);
            return rpoint;
        },

        //将 sphere 投影到 camera view 上
        _projectSphere: function (p) {

            p = new Vector3(p.x, p.y, this._focus).toXYZ(true);
            return this.project(p);
        },

        //vp --> pov
        _unprojectSphere: function (p) {
            return this.unproject({x: p.x, y: p.y}).toSpherical(true);

        },

        _updatePerspMat: function () {
            // TODO: Optimize this (cache and validate)
            // fov/2
            //this.fov = 60;
            var r = this._vw / this._vh;
            var f = 1 / Math.tan(this._bfov * Math.PI / 360);

            this._perspMat.copyFrom([
                f / r, 0, 0, 0,
                0, f, 0, 0,
                0, 0, -(this.far + this.near) / (this.near - this.far), 1,
                0, 0, 2 * this.near * this.far / (this.near - this.far), 0
            ]);
        },

        ////left-hand,opengl风格
        getProjectionMatrix: function () {

            return this._perspMat.toArray();
        },

        //
        getViewMatrix: function () {

            //return new Matrix([-0.7071067811865475, -0.40824829046386296, -0.5773502691896257, 0, 0, 0.8164965809277259, -0.5773502691896257, 0, 0.7071067811865475, -0.40824829046386296, -0.5773502691896257, 0, -0, -0, 0, 1]).transpose().toArray();
            return this._viewMat.toArray();
        },


        // 复合矩阵 视图+投影
        // Matrix.multiply 是左乘 行向量，所以所有的[vector3] * [matrix] 时都要将 matrix 置换(transpose)一下
        _modmat: new Matrix(),
        _updateProjMat: function (p, r) {

            var p = this._perspMat, r = this._viewMat;

            this._projMat.copyFrom(Matrix.multiply(r, p));

        },

        project2: function (v) {
            Matrix.multiplyVector(v, this._projMat.transpose());

            Matrix.multiplyVector(v.project(), this._screenmat.transpose());

            return {x: v.x, y: v.y, z: v.z, w: v.w};

        },

        projectToView: function (v) {
            Matrix.multiplyVector(v, this._projMat.transpose());
            return v.project();
        },

        pointInFrustum: function (v) {

            var b = [0, 0, 0];
            var tmp = new Vector3();
            Matrix.multiplyVector(tmp.copyFrom(v), this._projMat.transpose()).project();
            var winX = ( tmp.x + 1 ) / 2;
            var winY = ( tmp.y + 1 ) / 2;
            var winZ = ( tmp.z + 1 ) / 2;

            if (winX < 0) b[0] = -1;
            if (winX > 1) b[0] = 1;
            if (winY < 0) b[1] = -1;
            if (winY > 1) b[1] = 1;
            if (winZ < 0 || winZ > 1) b[2] = 1;
            return b;
        },

        inFrustum: function (points) {
            var count = points.length, tmp = new Vector3();

            var iTotalIn = 0;
            var t = [0, 0, 0];
            for (var i = 0; i < count; i++) {
                var iInCount = count;
                var iPtIn = 1;

                //Matrix.multiplyVector( tmp.copyFrom(points[i]) , this._projMat.transpose())//.project();
                var b = this.pointInFrustum(points[i]);
                t[0] += b[0];
                t[1] += b[1];
                t[2] += b[2];

            }
            if (t[0] == -count || t[0] == count || t[1] == -count || t[1] == count || t[2] == count) return -1;
            else return 1;
        },


        //将 空间点 投影到 视口，返回视口坐标,不在视野内返回 undefined
        project: function (v) {
            var np = this._vp;
            //v.clone().rotateX(-this._rx).rotateY(-this.ry);//,
            //var p1 = Vector3.rotate( v.clone() , new Vector3(-this._rx , -this._ry , 0));
            //var m = Matrix.euler2matrix({x:-this._rx , y:-this._ry , z:0});
            var rpoint = v.clone();

            //对投影点应用 旋转矩阵
            Matrix.multiplyVector3x3(this._viewmat, rpoint);

            // var ray = new P.geom.Ray( new Vector3(0,0,0) , rpoint);
            var c1 = rpoint.intersectTriangle(np[0], np[1], np[2]);
            //P.logger("corss 1:" + c1)
            if (c1 === false) {
                c1 = rpoint.intersectTriangle(np[0], np[2], np[3]);
            }

            //c1<0 在背面
            if (c1 !== false && c1 >= 0) {
                var p1 = Vector3.multiply(rpoint, c1);
                return {x: p1.x + this._vw / 2, y: this._vh / 2 - p1.y};
            }

            return undefined;

        },

        //将vp面坐标{x,y}，投影到 世界坐标 ，返回 方向向量
        unproject: function (v) {
            var ix = v.x - this._vw / 2;
            var iy = this._vh / 2 - v.y;

            v = new Vector3(ix, iy, this._focus);
            // wowrot 是 rotmat 的转置矩阵
            Matrix.multiplyVector3x3(this._wowrot, v);
            return v;
        }
    }

    return Camera;

})