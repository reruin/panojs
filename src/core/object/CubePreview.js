P.module('P.core.object.CubePreview',[],function(){

    function cubePreview(scene){
        this.prefix = P.prefix.css;
        this.scene = scene;
        this._pano = scene._pano;

        this.prefix = P.prefix.css;
        this.size = 256;
        this.init();
    }

    cubePreview.prototype = {
        ready:undefined,
        list :[],
        _positionTransform: {
            'l': "rotateY(90deg)",// translate3d(-1026px, -1026px, -1024px),
            'f': "rotateY(0deg)", //translate3d(-1024px, -1026px, -1024px),
            'r': "rotateY(-90deg)", //translate3d(-1026px, -1026px, -1024px),
            'b': "rotateY(180deg)", //translate3d(-1024px, -1026px, -1024px),
            'u': "rotateX(-90deg)", //translate3d(-1024px, -1024px, -1024px),
            'd': "rotateX(90deg)"
        },

        reset : function(){
            this.clear();
            this.ready = undefined;
        },

        getTransform: function (tf) {
            var size = this.size;
            var vw = this._pano.getViewWidth() , vh = this._pano.getViewHeight();
            var fos = this._pano._camera._focus;
            var pitch = -this._pano.pitch;
            // PC : chrome 37.0 + CSSRender ,
            // perspecive == translateZ && heading=0 时 某些面不可见，为 translateZ +加一个极小值
            return "translate(" + vw / 2 + "px, " + vh / 2 + "px) translateY(" + 0 + "px) perspective(" + fos + "px) rotateZ(0deg) translateZ(" + (fos+1e-10) + "px) rotateX(" + pitch + "deg) rotateY(" + this._pano.heading + "deg) " + tf;
        },

        init : function(){
            this._container = P.creat("div", "pano-scene-preview", null, this.scene._viewport, "position:absolute;left:0;top:0;");
            //this._pano.addEventListener("renderbefore" , P.bind(this.render,this));
            //this._pano.addEventListener("pano_changed_before" , P.bind(this.render,this))
        },
        render:function(){
            //if(this._pano._scene._fz[0]==0) return;
            var pre = this.prefix + "transform";
            for(var i in this.list)
            {
                this.list[i].obj.style[pre] = this.getTransform( this.list[i].transform );
            }
        },
        clear:function(){
            for(var i in this.list){
                this._container.removeChild( this.list[i].obj );
                this.list[i].obj = null;
            }
            this.list = [];
        },
        addThumb:function(f , ix , iy , image , crop){
            var id = [f,ix,iy,0].join("_");

            var tilesize = this.size * 0.5;

            var tz = -tilesize;
            ix = ix-1; iy = iy-1;

            var tx = ix * tilesize ,
                ty = iy * tilesize;
            var t3d = this._positionTransform[f] + ' translate3d('+tx+"px,"+ty+"px,"+tz+"px)"

            //显示大小
            var v_size = this.size;
            var t_size = crop[2]; //瓦片大小
            var scale = v_size / t_size;

            var c = P.creat("div", "pano-tile-"+id, null, this._container, "overflow: hidden; position: absolute;"
             + 'width:'+v_size+'px;height:'+v_size+'px;'
             + 'background:url('+image.src+') -'+crop[0]*scale+'px '+(0-crop[1]*scale)+'px no-repeat;background-size:'+image.width*scale+'px '+image.height*scale+'px;'
             + this.prefix+"transform-origin: 0px 0px;"
             + this.prefix+"transform:"
             + this.getTransform(t3d));


/*            var c = P.creat("canvas", "pano-tile-"+id, "*//*transformFade*//*", this._container, "overflow: hidden; position: absolute; "
            + this.prefix+"transform-origin: 0px 0px;"
            + this.prefix+"transform:"
            + this.getTransform(t3d));

            c.width = c.height = this.size;

            var ctx = c.getContext('2d');

            crop.unshift(image);

            ctx.drawImage.apply(ctx , crop);*/

            this.list.push({
                id:id,
                obj:c,
                transform:t3d
            });
        },

        load: function (src , cb) {
            var self = this ;
            var size = 256;
            var face;
            new loader(src)
                .success(function (image) {
                    self.clear();
                    var tilesize = image.height;
                    var h = image.height , w = image.width , m = 0;

                    if (Math.round(w / h) == 6) {
                        m = 0
                    }
                    if (Math.round(w / h) == 1.5) {
                        m = 1;
                        tilesize *= 0.5;
                    }
                    if(Math.round(h/w) == 6)
                    {
                        m = 2;
                        tilesize = w;
                    }
                    var lays = [
                        [
                            [0, 0],[1, 0],[2, 0],[3, 0],[4, 0],[5, 0]
                        ],
                        [
                            [0, 0],[1, 0],[2, 0],
                            [0, 1],[1, 1],[2, 1]
                        ],
                        [
                            [0,0],[0,1],[0,2],[0,3],[0,4],[0,5]
                        ]
                    ][m];
                    var l = ["f", "r", "b", "l", "u", "d"];
                    var fi = [0,3,1,2,4,5];// f b l r u d
                    //tilesize=128
                    //alert(tilesize)
                    //self.size = tilesize;
                    for (var i = 0; i < l.length; i++) {
                        face = l[i];
                        var crop = [lays[i][0] * tilesize, lays[i][1] * tilesize, tilesize, tilesize, 0, 0, self.size, self.size];
                        self.addThumb(face, 0, 0, image,crop);
                    }

                    image = null;
                    //0 级别加载完毕
                    self.ready = true;
                    //self._checkTiles();
                    //typeof(self.callback) == "function" && self.callback();
                    self.scene._pano.render();
                    //self.scene._pano._viewport.removeChild(self.scene._container);
                    console.log();
                })
                .error(function () {
                    //self.face == "pre"
                });

        }
    }

    function loader(url){
        if (url) this.load(url);
    }

    loader.prototype = {
        _successFn: null,
        _image: null,
        _status: null,
        _process: 0,


        load: function (url) {
            this._image = new Image();
            P.on(this._image, "load", this._onload, this);
            P.on(this._image, "error", this._onerror, this);
            this._image.src = url;
            return this;
        },

        _onload: function () {
            this._process = 1;
            this._status = "success";
            if (typeof this._successFn == "function") this._successFn(this._image);
            //this._image.src = null;
            this._image = null;
            return this;
        },

        _onerror: function () {
            this._process = 2;
            this._status = "error";

        },

        success: function (fn) {
            this._successFn = fn;
            if (this._status == "success" && this._process == 0) this._successFn(this._image);

            return this;
        },

        error: function (fn) {
            this._errorFn = fn;
            if (this._status == "error" && this._process == 0) this._errorFn(this._image);
        },

        CLASS_NAME: "P.object.Loader"
    }

    return cubePreview;
})