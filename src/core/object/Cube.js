P.module('P.core.object.Cube',[
    'P.base.http',
    'P.base.feature',
    'P.core.object.CubePreview',
    'P.core.math.Vector3',
    'P.core.geom.spherical'
],function(http,feature,CubePreview,Vector3,spherical){
    function cube(pano){

        this.prefix = P.prefix.css;

        if(feature.androidnative)
            this._onceMode = true;

        if(pano)
            this.addTo(pano);
    }

    cube.prototype = {
        _pano : null,

        options: {},

        _ignoneLv0 : false,

        _stamp : 0,

        /**
         *  瓦片大小 squara
         */
        tilesize : 512 ,

        /**
         * 临时加载列表
         */
        _current : [],

        /**
         * 当前状态需要显示的tiles 缓存
         */
        _currentCache : {},

        /**
         *  保存 已经加载的tiles : {}canvas
         */
        _tiles : {},

        /**
         * tiles缓存
         */
        _tilesCache : [],

        /**
         * tiles最大数量，android native 在此值过大时有性能问题
         */
        _maxTiles : 64,
        /**
         * tiles缓存最大值
         */
        _maxCache : 128,

        /**
         * 强制一次加载所有tiles：用于限定lv 的加载
         */
        _onceMode : false,

        /**
         * 当前加载的tiles数量
         */
        _totalTiles : 0,

        /**
         * 预览图加载检测
         */
        _previewReady : null ,

        //顶点着色代码
        vert : [
            'attribute vec3 a_vp;',
            'attribute vec2 a_tp;',
            'attribute float a_alpha;',
            'uniform mat4 u_view;',
            'uniform mat4 u_persp;',

            'varying mediump vec2 v_tp;',

            'void main(void) {',
            'gl_Position = u_persp * u_view * vec4(a_vp, 1);',
            //传递给片段着色器
            'v_tp = a_tp;',
            '}'
        ].join('')
        ,
        //片段着色代码
        frag : [
            'varying mediump vec2 v_tp;',
            'uniform sampler2D u_sampler;',

            'void main(void) {',
            // 每个tiles单独贴图
            'gl_FragColor = texture2D(u_sampler, v_tp);',
            '}'
        ].join(''),

        // webgl 对象数据
        data:{},

        //每级别 num数量
        //lv   0 1  2  3
        _fz : [6,24,96,384],

        _fz2 : [6,24,96,384],
        // Cube 顶点数组，初始面 没有用顶点索引
        /*
         3,2
         0,1
         */

        vertices : [
            -1,-1, 1,  1,-1,1,   1,1,1,  -1,1,1,   //前面
            1,-1,-1, -1,-1,-1, -1,1,-1,  1,1,-1,  //后面
            -1,-1,-1, -1,-1,1,  -1,1,1, -1,1,-1,  //左面
            1,-1, 1,  1,-1,-1,   1,1,-1,  1, 1,1,   //右面
            -1, 1, 1,  1,1, 1,   1,1,-1,  -1,1,-1,   //上面
            -1,-1,-1, 1,-1,-1,  1,-1,1, -1,-1,1,  //下面
        ],

        //face 的基础朝向 对应 transform@css
        _positionTransform: {
            'l': "rotateY(90deg)",// translate3d(-1026px, -1026px, -1024px),
            'f': "rotateY(0deg)", //translate3d(-1024px, -1026px, -1024px),
            'r': "rotateY(-90deg)", //translate3d(-1026px, -1026px, -1024px),
            'b': "rotateY(180deg)", //translate3d(-1024px, -1026px, -1024px),
            'u': "rotateX(-90deg)", //translate3d(-1024px, -1024px, -1024px),
            'd': "rotateX(90deg)", //translate3d(-1024px, -1024px, -1024px)
            'roads': ""
        },

        /*
         * TODO 切换时需要loading效果，等下一场景预览加载完毕后 再去除 本场景
         */
        reset : function(){
            this._tilesCache = [];

            //清除下载队列
            if(this._loaderQueue)
                this._loaderQueue.clear();

            for(var id in this._tiles)
                this._removeTile(id);

            this._fz = [6,24,96,384];

            //渲染到正确位置
            this._preview.render();
            this._preview.ready = undefined;
            //直接清除会导致 短暂的空白
            //this._preview && this._preview.reset();
        },
        /*
         * -1,-1   0,-1
         * -1, 0   0, 0
         *
         * 第五个参数 标示 该tile是否参与剔除操作
         * */
        _creatTileForCss : function(f , ix , iy , iz , image, useclip , crop){

            var id = [f,ix,iy,iz,this._pano._panoid].join("_");

            if(iz == -1) iz = 0;

            var sizenum = 1 << iz,
                hs = iz == 0 ? 1 : (sizenum/2);

            //render时 是否剔除
            useclip = arguments.length<5 ? true : useclip;

            var tilesize = iz==0 ? this.tilesize * 0.5 : this.tilesize;

            var tz = -tilesize/2<<iz;

            if(iz == 0) tz = -tilesize;
            //tilesize+=2;
            ix = ix - hs; iy = iy - hs;
            var tx = ix * tilesize ,
                ty = iy * tilesize;
            //if(tz == 0) P.logger("====================>"+ix+","+iy+":"+iz);

            //获取 对应 tile 的 transform
            var t3d = this._positionTransform[f] + ' translate3d('+tx+"px,"+ty+"px,"+tz+"px)"

            //使用image 代替 canvas
            var c = P.creat("img", "pano-tile-"+id, "transformFade", this._container, "overflow: hidden; position: absolute; "
             + this.prefix + "transform-origin: 0px 0px; "
             + this.prefix+"transform:"
             + this._pano._render.getTransform(t3d));

             c.width = c.height = this.tilesize;

             c.src = image.src;

            /*var c = P.creat("canvas", "pano-tile-"+id, "transformFade", this._container, "overflow: hidden; position: absolute; "
            + this.prefix + "transform-origin: 0px 0px; "
            + this.prefix+"transform:"
            + this._pano._render.getTransform(t3d));

            c.width = c.height = this.tilesize;

            var ctx = c.getContext('2d');

            if(crop)
            {
                crop.unshift(image);
                ctx.drawImage.apply(ctx , crop);
            }else
                ctx.drawImage(image, 0, 0);*/

            //cav.style.display = "inline";
            //保存缓存
            // this._currentCache.push( this._tiles[id] );
            //if(forpreview === true) return;

            var t = {
                id:id ,
                useClip : useclip ,
                /*diff : this._currentCache[id].diff,*/
                timestamp : this._stamp++,
                obj:c ,
                /*deep:this._currentCache[id].deep,*/
                transform:t3d
            };
            //if(this._tiles[id]) alert("cccc")
            this._tiles[id] = t;
            this._tilesCache.unshift(t);


            return c;

        },

        _creatTileForWebGL:function(image,vertex,id , oncemode){
            var t = {
                texture : webgl.texture2d(image, "RGB").unbind(),
                vertices: vertex,
                useClip : oncemode,
                id:id,
                timestamp : this._stamp++
            }
            this._tiles[id] = t;
            this._tilesCache.unshift( t );
        },

        //移除tile 操作,无视 tile的useclip
        _removeTile : function(id){

            if(this._tiles[id]) {

                if(this.render == "webgl"){
                    this._tiles[id].texture.dispose();
                }else if(this.render == "css")
                {
                    this._container.removeChild( this._tiles[id].obj );
                    this._tiles[id].obj = null;
                }
                //clear tilesArray
                this._tiles[id] = null;
                delete this._tiles[id];
            }
        },

        //TODO
        _removeTilesByLevel:function(l)
        {
            //for(var i=0)
            for(var i in this._currentCache)
            {
                if(this._currentCache[i].deep == l) this.removeTile(this._currentCache[i].id);
            }
        },

        /**
         * @private
         * 更新 displaylist 中无需显示的 tiles,//每一次 load tile image 执行
         */
        //TODO Uncaught TypeError: Cannot read property 'useClip' of undefined
        _updateTiles : function(){
            this._totalTiles = 0;
            //删除过早缓存,timestamp 排序
            this._tilesCache.sort( this._sortCache );

            if (this._tilesCache.length > this._maxCache + 50) {

                for(var i=this._tilesCache.length-1;i>this._maxCache; i--){
                    var id = this._tilesCache[i].id;
                    //console.log
                    if(this._tiles[id] && this._tiles[id].useClip == true) {
                        this._removeTile(id);
                    }
                    this._tilesCache.splice(i, 1);
                }

            }
            this._totalTiles = this._tilesCache.length;

            //console.log({'loaded':this._totalTiles,'total':this._fz[this._pano.getDeep()]});
            this._pano.trigger('load_tiles',{'loaded':this._totalTiles,'total':this._fz2[this._pano.getDeep() - 1]});
        },


        //瓦片loaded后 新建canvas 操作
        _onLoad: function (data , image) {

            var id = data.id ;

            if(
                !( id in this._currentCache) //某tile加载完毕时，已不在当前需要加载列表中，则丢弃处理。
                || ( id in this._tiles) //已在当前显示列表中，丢弃处理。
            ) return;


            var clv = this._pano.getDeep();

            // 计算fxyz
            var l = id.split("_") , f = l[0] , ix = Number(l[1]) , iy = Number(l[2]) , iz = Number(l[3]);

            if(this.render == "webgl")
            {
                this._creatTileForWebGL(image , data.vertex , id , this._onceMode ? false : true);

            }else if(this.render == "css")
            {
                this._creatTileForCss(f, ix, iy, iz, image , this._onceMode ? false : true);
            }

            //非检测渲染
            this._pano.render(false);

            if (this._onceMode == true)
                this._fz[iz]--;

            // oncemode 下 移除底图层
            if (this._onceMode && this._fz[iz] == 0 && iz == 0)
            {

                this._removeTilesByLevel(iz - 1);
                //this._preview.clear();
            }

            this._updateTiles();
        },

        getMousePosition: function () {  },

        addTo: function (pano) {
            this._pano = pano;
            this._viewport = pano._viewport;
            this._loaderQueue = new http.LoaderQueue({thread: 1, onUpdate: P.bind(this._onLoad, this)});
            this._initScene();
        },

        _initScene: function () {
            this._preview = new CubePreview(this);

            this._container = P.creat("div", "pano-scene-main", null, this._viewport, "position:absolute;left:0;top:0;");

            var pre = this.prefix;
            this.render = this._pano.options.render;
            if(this.render  == "webgl")
            {
                this._initWebGL();
            }

        },

        setSize : function(w , h){
            // webgl render
            if(this.canvas)
            {
                this.canvas.width = w;
                this.canvas.height= h;
                webgl.viewport(w,h);
            }
        },

        _initWebGL:function(){

            var c = P.creat("canvas", null, "", this._container, null);

            c.width = c.height = 256;

            var gl = webgl.init(c ,  {alpha: true, depth: false});

            this.canvas = c;

            webgl.creat(this.vert , this.frag).use().setting({CULL_FACE:true});//.color(0,0,0,0.5);

            this.data = {
                //顶点缓冲区 暂时不放数据
                vertBuffer : webgl.arrayBuffer(),//webgl.arrayBuffer(),
                texBuffer  : webgl.arrayBuffer([0,1,1,1,1,0,0,0]),//webgl.arrayBuffer([0,0,1,0,1,1,0,1]),
                indexBuffer : webgl.elementBuffer([0,1,2,0,2,3])//webgl.elementBuffer([0,1,2,0,2,3])
            };

        },

        //_tilecheckStatus : false ,
        _checkTiles : function(){

            /*if(this._tilecheckStatus == false)
                P.requestAnimationFrame(P.bind(this._checkTilesInvalidate , this));
            this._tilecheckStatus  = true;*/
            this._checkTilesInvalidate();
        },


        /**
         * *
         * @private
         * 下一帧检测，检测需要加载的瓦片，不要绑定到 render，尽量从 pano.render 触发 瓦片检测
         */
        _checkTilesInvalidate: function () {
            //if (this._pano._provider == null || this._pano._provider.ready != true) return;

            if(this._pano == undefined) return;

            if (this._pano._panoData == null) {this._tilecheckStatus  = false;return;}

            //load preview 加载预览图
            if(this._preview.ready === undefined){
                this._preview.ready = false;
                this._preview.load(this._pano._getTileUrl({x:0,y:0,z:-1}) );
            }

            //在预览图加载完成前 不执行checkTiles
            if(this._preview.ready !== true){ this._tilecheckStatus  = false; return;}

            //get current deep 获取当前深度级别（可能由 w/h , fov , focus , zoom 等引起）
            var clv = this._pano.getDeep();//1 + Math.floor( this._pano.focus * this._pano.zoom  / (this.size*0.5));

            // 在一次装载模式下，最高级别已经加载完，则不执行 checkTiles
            if(this._onecMode && (this._fz[this._pano.maxDeep] == 0)) {this._tilecheckStatus  = false; return;}

            //alert()
            //清空待加载列表
            this._current = [];
            this._currentCache = {};


            // cube 顶点
            var vertices = this.vertices;

            //初始6faces,循环检测面，从0级别开始，checkFaceTile包含四叉树的递归查询，结果保存在 current[] 中
            for (var i = 0; i < 6; i++) {
                var f = i * 12;

                this._checkFaceTile(
                    [
                        new Vector3(vertices[f + 0], vertices[f + 1], vertices[f + 2]),
                        new Vector3(vertices[f + 3], vertices[f + 4], vertices[f + 5]),
                        new Vector3(vertices[f + 6], vertices[f + 7], vertices[f + 8]),
                        new Vector3(vertices[f + 9], vertices[f + 10], vertices[f + 11])
                    ]
                    , false);
            }

            //P.logger("load TILES："+this._current.length);

            // 更新当前显示列表
            this._updateTiles();
            //传递至 队列加载器
            if (this._current.length > 0){

                //加载tiles排序
                this._current.sort( this._sortQueue );
                this._loaderQueue.add(this._current);
            }
            //console.log("check face")
            this._tilecheckStatus  = false;
        },

        /**
         *
         * @param vertices
         * @param checkcurrent 是否检测当前面
         * @private
         * 缓存部分定点判断 加快检测速度,
         *  传入顶点
         *  3    2
         *
         *  0    1
         *
         *  tile 四叉树 顶点位置
         *  0  1  2
         *  3  4  5
         *  6  7  8
         */

        _checkFaceTile: function (vertices, checkcurrent) {
            var svt = [] ,
                inview = false,
            // vertices index 节点索引
                vi = [
                    [3, 4, 1, 0],
                    [4, 5, 2, 1],
                    [6, 7, 4, 3],
                    [7, 8, 5, 4]
                ],

                cam = this._pano._camera,

            //保存顶点位置判断结果
                v = [];

            /**
             ** 根据顶点计算级别
             ** 公式 iz = log2( 2 / modulo ) + 1
             */
            //依据顶点距离 计算上层矩形的显示级别
            var iz = Math.round( Math.log( 2 / vertices[0].sub(vertices[1]).modulo()) / Math.LN2);

            //console.log(iz)
            // 无需对上层矩形做检测
            if (checkcurrent !== false) checkcurrent = true;

            //当前显示级别
            var clv = this._pano.getDeep();
            if(clv > this._pano._maxDeep) clv = this._pano._maxDeep;

            if (checkcurrent) {
                inview = cam.intersectSquare(vertices);
            } else {
                inview = true;
            }

            //添加当前瓦片到 显示列表中

            //在视野内,检测子矩形
            if (inview !== false) {

                if(iz<=clv && !(this._ignoneLv0 == true && iz == 0)) {
                    this.addTile(vertices, iz);
                }

                //保存4小矩形顶点
                svt[0] = vertices[3].clone();
                svt[1] = vertices[3].add(vertices[2]).multiply(0.5);
                svt[2] = vertices[2].clone();
                svt[3] = vertices[3].add(vertices[0]).multiply(0.5);
                svt[4] = vertices[3].add(vertices[1]).multiply(0.5);
                svt[5] = vertices[2].add(vertices[1]).multiply(0.5);
                svt[6] = vertices[0].clone();
                svt[7] = vertices[0].add(vertices[1]).multiply(0.5);
                svt[8] = vertices[1].clone();


                for (var i = 0; i < 4; i++) {

                    // 判断小矩形是否在视野内
                    var rf = [ svt[vi[i][0]] , svt[vi[i][1]] , svt[vi[i][2]] , svt[vi[i][3]] ];
                    var rp = cam.intersectSquare( rf );
                    //if(rp) P.logger(true)
                    // 视野内可见
                    if (rp) {

                        //在可视级别下则 添加
                        //子矩形 级别为 iz + 1
                        /*if(iz<=clv) this.addTile(rf, iz+1);
                         console.log(iz+","+clv)*/
                        //递归检测测下个级别
                        if(iz<=clv-1) {
                            //console.log("next")
                            this._checkFaceTile(rf, false);
                        }
                    }
                }

            }
            //console.log("check face : "+iz)
        },

        /**
         * @param vertices
         * @returns {number}
         * @private
         * 计算瓦片到视野中心的距离 以供排序
         */
        _calcDist:function(vertices){
            //面中心点转换到球面坐标
            var center = vertices[0].add(vertices[1]).add(vertices[2]).add(vertices[3])
                .multiply(0.25)
                .toSpherical();
            var iy = this._pano.pitch , ix = this._pano.heading;
            //console.log(center)
            //P.geom.Latlng.fastCalcDistance();
            var toDeg = 180 / Math.PI;
            var lat1 = center.y * toDeg , lng1 = center.x*toDeg;
            var lat2 = this._pano.pitch * -1,lng2 = this._pano.heading;
            return spherical.computeDistance({lat:lat1, lng:lng1} , {lat:lat2, lng:lng2});

        },

        /**
         * @param a
         * @param b
         * @returns {number}
         * @private
         * 缓冲区更新排序，stamp高者优先
         */
        //early time first。
        _sortCache : function(a , b){
            /* if(a.useClip == b.useClip)
             {
             return a.diff - b.diff
             }*/
            //var k = b.deep - a.deep;
            var k = b.timestamp - a.timestamp;

            return k;
        },

        /**
         * @param a
         * @param b
         * @returns {number}
         * @private
         * 加载优先：deep=0 优先，deep 高者优先，dist 近者优先
         *
         */
        _sortQueue : function(a , b){
            //基础级别 优先加载，由于 lv=0是由 preview 提供的，所以此处不会有 deep0 的检测
            // 1.高zoom优先
            // 2. dist 近者优先
            if (a.deep == 0 && b.deep != 0) {
                return -1;
            }
            if (b.deep == 0 && a.deep != 0) {
                return 1;
            }
            var k = a.deep - b.deep;


            if(k == 0 ) k = a.dist - b.dist;
            return k;

            // return b.timestamp - a.timestamp;
        },




        /**
         * 添加 需加载的瓦片 ,
         * TODO 可建立 hash 加快计算
         * */
        addTile: function (vertices,iz) {
            // cache tiles at current level 缓存当前级别的 tiles
            //计算 x y z face
            var numTiles = 1 << iz, p0 = vertices[0].add(vertices[1]).add(vertices[2]).add(vertices[3]).multiply(0.25),
                p = vertices[3],
                face, ix, iy, tx, ty;
            // 标准化 的 cube 边长 2
            var resolution = 2 / numTiles;

            //检测面
            if (p0.x == 1) face = "r";
            else if (p0.x == -1) face = "l";

            if (p0.y == 1) face = "u";
            else if (p0.y == -1) face = "d";

            if (p0.z == 1) face = "f";
            else if (p0.z == -1) face = "b";

            //快速处理 0级
            if(iz == 0)
            {
                ix = 0 ; iy = 0 ; iz = 0;
            }else {
                // 转换到平面
                // XOY
                if (face == "f") { tx = p.x;  ty = p.y; }

                if (face == "b") { tx = -p.x; ty = p.y; }

                // YOZ
                if (face == "l") { tx = p.z;  ty = p.y; }

                if (face == "r") { tx = -p.z; ty = p.y; }

                // XOZ
                if (face == "d") { tx = p.x; ty = p.z; }

                if (face == "u") { tx = p.x; ty = -p.z; }


                //转换到 屏幕xoy

                tx += 1;  ty = 1 - ty;
                ix = Math.floor(tx / resolution);
                iy = Math.floor(ty / resolution);

            }

            var id = [face, ix, iy, iz, this._pano._panoid ].join("_");
            //if(ix==2) P.logger(tx)

            //计算瓦片 与 视野中心的距离 用于排序
            var diff = Math.floor(this._calcDist(vertices));

            if(id in this._tiles)
            {
                //缓冲区的 timestamp 会同时改变
                this._tiles[id].timestamp = this._stamp++;

                //修改 缓冲区 的 stamp，使其提前。
                // var index = this._searchCache(id);// console.log(id+","+index)
                //console.log(id)
                //if(index >=0 ) {console.log(id);this._tilesCache[index].timestamp = this._stamp++;}

                return;
                // tilesArray 同步更改
            }else{
                //if(id in )

                //加入待加载列表
                if(this._currentCache[id] == undefined) this._currentCache[id] = {
                    id: id,
                    url: this._pano._getTileUrl({f: face, x: ix, y: iy, z: iz , id : id}),
                    deep : iz,
                    diff : diff,
                    vertex : this.getVertex(vertices)
                };
                this._current.push(this._currentCache[id]);
            }

        },

        _searchCache : function(id){
            for(var i=0;i<this._tilesCache.length;i++){
                if(this._tilesCache[i].id == id) return i;
            }
            return -1;
        }
        ,
        //面 转换为 array[vecor3*4]
        getVertex : function(v){
            var a = [];
            for(var i=0;i< v.length;i++)
                a = a.concat( v[i].toArray() );
            //P.logger(a)
            return a;
        },


        _creatArrow: function (v) {
            this.roadList = [];
            for (var i = 0; i < v.length; i++) {
                var id = v[i].id , dir = v[i].dir % 360;
                this.roadList[i] = P.creat("canvas", null, null, this.roads, "display:none;overflow: hidden; position: absolute; " + this.prefix + "transform: rotateX(" + dir + "deg) translateY(-120px);", {"data-id": id});
            }
        },

        _creatCanvas: function (cls) {
            var c = P.creat("canvas", null, cls, this._container, "display:none;overflow: hidden; position: absolute; " + this.prefix + "transform-origin: 0px 0px; ");
            c.width = c.height = this.tilesize;
            return c;
        },

        _checkTexture: function () {
            var h = (this._pano.getPov().heading + 45) % 90 , f = ["f", "r", "b", "l", "u", "d"];

        }
    }

    return cube;
})