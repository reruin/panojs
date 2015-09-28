P.module('P.core.Pano',[
    'P.core.Camera',
    "P.anim.Timeline",

    'P.base.events',
    "P.base.utils",
    "P.base.http",
    "P.base.dom",
    "P.base.feature",
    "P.base.code",
    "P.base.services",

    "P.interaction.Drag",
    "P.interaction.Keyboard",
    "P.interaction.PinchZoom",
    "P.interaction.WheelZoom"


 ], function(Camera,Timeline,events,utils,http,dom,feature){

    var CssRender = P.require('P.render.CssRender'),
        WebGLRender = P.require('P.render.WebGLRender'),
        BasicRender = P.require('P.render.BasicRender'),
        LabelLayer = P.require('P.overlays.LabelLayer'),
        Cube = P.require('P.core.object.Cube');
    //console.log(Cube)


    var DEFAULT_INTERACTION = {
        PinchZoom: feature.touch && !feature.android23,
            Drag: true,
        WheelZoom: !feature.touch,
        Keyboard: !feature.touch
    };

    function pano(node, opts){
        this.options = P.setOptions(this, opts);

        if (this._check() == false) {
            this._error();
            return;
        }

        //for(var i in )
        this._initScene(node);

        this._regListener();

        // 初始化 可交换控件
        for (var i in DEFAULT_INTERACTION) {

            if (this.options[i] || (!this.options[i] && DEFAULT_INTERACTION[i])) {
                this.addInteraction(i , new (P.require("P.interaction." + i))());
            }
        }

        if(this.options.provider)
            this.addProvider( this.options.provider );

        if(this.options.scrollwheel == false)
            this.interactions["WheelZoom"].deactivate();

        if(this.options.addressControl == true)
            this.addControl( new P.control.AddressControl());

        this.animation = new Timeline(this);
    }

    pano.prototype = {

        heading: 0, pitch: 0, zoom: 0.8, focus: 227, fov:120, viewWidth : 1 , viewHeight : 1,

        minfov : 1, maxfov : 135, maxPitch : 89.99 , minPitch : -89.99, _maxpixelzoom : 1.0, //defaultfov:120,

        options: {_server:"", provider:null , disableDefaultUI:false , addressControl:false , imageDateControl:false , zoomControl:false , scrollwheel : true , controlMode : 1 ,_renderPreview : true},

        _render: null,  _scene: null,  _camera: null,

        _provider: null,

        _maxZoom : 1 , _minZoom : 0.5, _maxDeep : 0,

        _panoData:null, _panoLink:null, _panoPoi:null, _panoid : null ,

        _labelLayer : null,

        interactions : {}, controls : [],

        animation : null,

        //状态快照
        _frameState : {time: P.now() , pan:[0,0], zoom : 0.8 , process:{pan:false , zoom:false, bounce:false}, animate:false},

        _visiable: true,


        // fns call set 用于 函数混入
        fns:{},

        get : function(v){
            if(this.fns[v])
                return this.fns[v].apply(this.fns[v],Array.prototype.slice.call(arguments , 1));
        },
        set : function(v,fn){
            this.fns[v] = fn;
            return this;
        },

        setMode: function (v) {

        },

        panTo: function (x , y) {
            var np = this._camera._unprojectSphere( {x:x , y:y} );

        },

        getVisible:function(){ return this._visiable; },

        setVisible:function(v){
            this._visiable = v;
            this._container.style.display =  v ? "inline" : " none";
            return this ;
        },

        getLocation : function(){
            return this._panoData.location;
        },

        getPosition : function(){
            return this._panoData.location.latLng;
        },

        getLinks : function(){
            return this._panoLink;
        },

        setLinks : function(v){
            this._panoLink = v;
        },

        setPano:function(id){
            if(this._panoid === id)
                return this;

            if(this._scene)
                this._scene.reset();

            this._panoid = id;

            if(this.options.provider)
            {
                // provider 通过异步返回 panodata
                if(this.options.provider.sync === false) {
                    this.options.provider.getPanoById(id , P.bind(function(d){
                        if(d) {
                            this._panoData = d;
                            this._panoLink = this._panoData.link;
                            this.trigger("pano_changed");
                            this.trigger("link_changed");
                            this._calcDeep();
                            this.render();
                        }

                        if(this.options.provider.getPoiById && this.options.displayPOI)
                        {
                            this.options.provider.getPoiById( id , P.bind(this._addPoi , this));
                        }
                    }, this));
                }else
                {
                    this._panoData = this.options.provider.getPanoById(id);
                    this._panoLink = this._panoData.links;

                    this.trigger("pano_changed");
                    this.trigger("link_changed");

                    if(this.options.provider.getPoiById && this.options.displayPOI)
                    {
                        this._addPoi( this.options.provider.getPoiById(id) );
                    }


                    this._calcDeep();
                    this.render();

                }


            }

            return this;
        },

        getPano : function(){
            return this._panoid;
        },

        _addPoi:function(data){
            if(this._labelLayer) this._labelLayer.clear();
            for(var i in data)
            {
                if(data[i].type == "span") {P.span(data[i]).setPano(this);}
                else if(data[i].type == "icon") P.icon(data[i]).setPano(this);
                else P.label(data[i]).setPano( this ) ;
            }
        },

        //将球面坐标 a 定位到 vp 坐标 b
        _panTo:function(a, b){

            //获取vp坐标b 逆投影的球面坐标
            var to = this._camera._unprojectSphere(b),
                center = this.getPov();
            center.heading += (a.x - to.x) ; center.pitch += (a.y - to.y);
            this.setPov(center);
        },

        // lookat vp 坐标
        setZoom: function (v, sub, updateTiles , lookat) {

            if (sub === undefined) sub = false;

            this.zoom = sub ? (this.zoom - v) : v;
            this.zoom = this.zoom > this._maxZoom ? this._maxZoom : (this.zoom < this._minZoom ? this._minZoom : this.zoom);


            var fov = this.maxfov * this.zoom;

            //console.log(this.zoom)
            if( this.options.render =="basic" )
            {
                this.setFov(fov);
            }else
            {

                var ori;
                if(lookat) ori = this._camera._unprojectSphere( lookat );
                //console.log(ori)
                //alert(fov)
                this.setFov(fov);
                // update vp
                if(lookat && ori!=undefined ){  this._panTo({x:ori.x , y:ori.y}, lookat); }
            }



            this.render(updateTiles);
        },

        getHeading: function (wrap) { return wrap===false ? this.heading : ((this.heading + 3.6e5) % 360);},

        getPitch : function(){  return this.pitch;  },

        setPov: function (obj, sub , updateTiles) {
            if (sub === undefined) sub = false;

            if (obj.heading != undefined)
                this.heading = sub ? (this.heading + obj.heading) : obj.heading;
            if (obj.pitch != undefined)
                this.pitch = sub ? (this.pitch + obj.pitch) : obj.pitch;

            //prevent heading pitch lock
            this.pitch = this.pitch > this.maxPitch ? this.maxPitch : (this.pitch < this.minPitch ? this.minPitch : this.pitch);
            //if(this.heading % 90 ==0) this.heading+= 1e-10;
            this._camera.rotate(this.heading , this.pitch);
            //alert("_checkTiles")


            this._render._update();
            //console.log(obj.heading)
            this.render(updateTiles);
            //this._render.render(updateTiles);
            //P.logger("set Pov : "+this.heading+" , "+this.pitch);
        },

        setFov:function(v){
            this.fov = v;
            if(this.fov > this.maxfov) this.fov = this.maxfov;
            if(this.fov < this.minfov) this.fov = this.minfov;

            this._calcFov();
            //变换视图矩阵
            this._camera.update(this.viewWidth, this.viewHeight, this.fov );

            this._calcDeep();
            this._calcPitch();

            this.render();
        },

        getDeep:function(){
            return this.deep;
        },

        // resize 引起的 minfov maxfov(basicrender) 变化
        _calcFov : function(){

            var r = this.viewHeight / this.viewWidth;

            if (r > 0.75) r = 0.75;

            // 最大focus 反算
            this.minfov = Math.atan(this.viewHeight / r / (this._scene.tilesize << (this._maxDeep+ this._maxpixelzoom) )) * 360 / Math.PI;
            //this.minfov = Math.atan(this.viewHeight / r / (this._scene.tilesize << this._maxDeep)) * 360 / Math.PI / (1 + this._maxpixelzoom);

            if(this._minDeep){
                this.maxfov = Math.min( this.maxfov ,
                    Math.atan(this.viewHeight / r / (this._scene.tilesize << (this._minDeep + 0.01) )) * 360 / Math.PI
                )
            }

            if(this.options.render == "basic")
                this.maxfov = Math.atan( 0.5 ) * 360 / Math.PI;

            this._minZoom = this.minfov / this.maxfov;

            if(this.zoom<this._minZoom)
                this.zoom = this._minZoom;

            var fov = this.maxfov * this.zoom;
            if(this.fov != fov) {
                this.fov = fov ;
                return true;
            }else
                return false;
        },

        _calcPitch : function(){

            if(this.options.render == "basic")
            {

                var v = this._camera.getViewportFor2D( this._scene.tilesize );
                var p = (0.5 - v[1]/2)*90 ;//[0 , 0.5]

                this.maxPitch = p;
                this.minPitch = -p;

                var v;
                if(this.pitch > this.maxPitch) v = this.maxPitch;
                if(this.pitch < this.minPitch) v = this.minPitch;
                if(v != this.pitch) this.setPov({pitch : this.pitch});

            }
        },
        //在每次fov改变 (resize zoom) 时检测 deep
        _calcDeep:function(){

            this.deep = Math.round( Math.log( this._camera._focus / this._scene.tilesize) / Math.LN2 + 1 );

            if(this.deep > this._maxDeep) this.deep = this._maxDeep;

            if(this.deep < this._minDeep) this.deep = this._minDeep;

            //TODO : deep = 0
            //console.log(this.deep)
            if(this.kinetic) this.kinetic.deceleration = 0.002 / (this.deep < 1 ? 1 : this.deep);
        },

        _getTileUrl : function(data){
            data.panoid = this._panoid;

            //var k = P.extend({},data);//{panoid : data.panoid};

            // console.log(data)
            return  this._panoData.tiles.getTileUrl(data);
        },

        getZoom: function () {  return this.zoom;  },

        getFocus: function () {  return this.focus; },

        getPov: function () { return {heading: this.heading, pitch: this.pitch}; },

        getPhotographerPov : function(){
            return {}
        },

        getSize: function () {  return new P.geom.Point(this.viewWidth, this.viewHeight); },

        getViewWidth: function () { return this.viewWidth; },

        getViewHeight: function () { return this.viewHeight;  },

        //[p0 ,  p1 , p2 , p3 ]
        getViewport: function () {  return this._camera._vp; },

        _nextFrame : false,

        setSize: function (w, h) {
            if(this._nextFrame == true) return;
            this._nextFrame = true;
            P.requestAnimationFrame(P.bind(this._invalidateSetSize , this , w , h));

        },

        _invalidateSetSize : function(w , h){

            //重设值
            this._wrap.style.width = w+"px";
            this._wrap.style.height = h+"px";

            this.viewWidth = w;
            this.viewHeight = h;

            this._calcFov();

            this._camera.update(this.viewWidth, this.viewHeight, this.fov);

            this._calcPitch();

            this._scene.setSize(w,h);

            this.render();
            this._nextFrame = false;
        },

        getContainer: function () {
            return this._container;
        },

        getViewPortFromPov: function () {},


        panoToViewport: function (pov) {},

        //checkViewTiles : function(){},

        addHandler: function () {

        },

        addControl: function (v) {
            this.controls.push(v);
            console.log(v)
            v.addTo(this);
            return this;
        },
        removeControl: function () {
        },

        addInteraction: function (i , v) {
            this.interactions[i] = v;
            v.addTo(this);
            return this;
        },

        removeInteraction: function () {
        },

        addProvider: function (v) {

            //if(v.maxZoom) this._maxZoom = v.maxZoom;
            //if(v.minZoom) this._minZoom = v.minZoom;
            // override options;
            this._maxDeep = v.maxDeep==undefined ? 1 : v.maxDeep;
            this._minDeep = v.minDeep==undefined ? 0 : v.minDeep;
            this._scene.tilesize = v.options.size;
            this._scene._onceMode = v.options.onceMode || false;
            this._scene._ignoneLv0 = v.options.ignoneLv0 === undefined ? false : v.options.ignoneLv0;
            this._maxpixelzoom = v.options.maxpixelzoom===undefined ? 1 : v.options.maxpixelzoom;
            //是否渲染 预览图
            this._renderPreview = this.options._renderPreview;
            if(this._renderPreview != true){
                this._renderPreview = v.options.renderPreview === true ? true : false;
            }


            this._displayPoi = v.options.displayPoi === true ? true : false;
            //console.log(v);
            // maxdeep = 0,内部强制oncemode
            if(this._maxDeep == 0) this._scene._onceMode = true;
            if(feature.androidnative && v._maxDeep>2) v._maxDeep = 1;


            if(this.options.render == "basic") this._scene._onceMode = false;
            //var fos =  this._scene.tilesize << (this._maxDeep-1);


            this.options.provider = v;

            //v.onAdd();
            this.trigger("provider_load");
            this.resize();

            if(this._panoid != null) this.setPano(this._panoid);

            return this;
        },

        removeProvider: function (p) {},


        _regListener: function (onOff) {

            onOff = onOff || 'on';


            var events = ['dblclick', 'click', 'mousedown', 'mouseup', 'mousemove', 'contextmenu'], i;

            for (i = events.length; i--;) {
                P[onOff](this._container, events[i], this._mouseEvent, this);
            }

            P.on(window, "resize", this.resize, this);
        },
        _mouseEvent: function (e) {
            var type = e.type;
            if (type === 'contextmenu') this._showContextMenu();
        },
        _showContextMenu: function () {
        },

        _initScene: function (id) {
            var container = document.getElementById(id);

            if (!container) {
                throw new Error('Pano container not found.');
            } else if (container.__pano) {
                throw new Error('Pano container is already initialized.');
            }
            container.__pano = true;

            dom.addClass(container, 'pano-container'
            + (feature.touch ? ' pano-touch' : '')
            + (feature.retina ? ' pano-retina' : '')
            + (feature.ielt9 ? ' pano-oldie' : ''));

            var position = dom.css(container, 'position');

            if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
                container.style.position = 'relative';
            }
            this._container = container;
            this._wrap = P.creat("div", null, "pano-wrap", this._container, "position: absolute; overflow: hidden; line-height: normal; font-weight: normal; font-style: normal; outline: 0px; width: 100%; height: 100%; background: #000000;-webkit-user-select: none; -webkit-tap-highlight-color: transparent;");
            //必须屏蔽掉 mouse事件。防止 transform 异常。事件绑定在 control下的 dragmask上。
            this._viewport = P.creat("div" , null , "pano-viewport" , this._wrap , "position: absolute; left: 0px; top: 0px;width:100%;height:100%;overflow: hidden; pointer-events: none;");
            this._control = P.creat("div", null,"pano-control" , this._wrap, "position: absolute; left: 0px; top: 0px;-webkit-transform-style: preserve-3d;transform-style: preserve-3d;width:100%;height:100%;");
            this._dragMask = P.creat("div", null,"pano-dragmask" , this._control, "transform: translateZ(1000000000000px);z-index:2001;position: absolute; left: 0px; top:0;width:100%;height:100%;");

            //TODO:control 添加一个遮罩，否则 第一个 control 无背景
            //P.creat("div",null,"pano-control-mask",this._control,"transform: translateZ(1000000000000px);z-index:9999999999;position: absolute; left: 0px; top:0;width:100%;height:1px;background:rgba(0,0,0,0)");

            //this._viewport = P.creat("div", null, "pano-viewport", this._container, "overflow: hidden;position: absolute; -webkit-user-select: none; left: 0px; top: 0px;width:100%;height:100%;background:#000000;");

            // 初始化 labelLayers
            this._labelLayer = new LabelLayer(this);

            if (this.options.render == "css")
                this._render = new CssRender(this);
            else if(this.options.render == "webgl")
                this._render = new WebGLRender(this);
            else if(this.options.render == "basic")
                this._render = new BasicRender(this);


            if (this.options.type == "cube")
                this._scene = new Cube(this);

            this._camera = new Camera(this.options.render=="basic" ? "vfov":"mfov");


        },

        _check: function () {

            return true;
        },

        _error: function () {
            //this._container.innerHTML = '<table width="100%" height="100%"><tr valign="middle"><td><center>提示:<br/>此网页需要支持CSS3D的浏览器来浏览<br/>您可以使用最新的Safari或Chrome浏览器，或者iOS操作系统的设备iPhone,iPad,iPod Touch)上的浏览器<br/></center></td></tr></table>';
        },

        fullScreen: function () {

            if (!P.full.isFullScreen()) P.full.requestFullScreen(this._container);
            else P.full.cancelFullScreen();
        },

        frameSnapshot : function(){
            this._frameState.time = P.now();
            this._frameState.pan = [this.heading%360 , this.pitch];
            this._frameState.zoom = this.zoom;

        },

        render: function (updateTiles) {
            //P.logger.info('render');
            if(this._renderTick) return;
            this._renderTick = true;
            P.requestAnimationFrame(P.bind(this.invalidateRender , this , updateTiles));
        },

        _renderTick:false,

        invalidateRender : function(updateTiles)
        {

            this.trigger("renderbefore");

            this.frameSnapshot();

            if(!updateTiles) this._scene._checkTiles();

            this._render.render();

            if(this._renderPreview) this._scene._preview.render();

            //刷新覆盖层
            this._labelLayer.draw();

            this.trigger("render");

            this._renderTick = false;
        },

        resize: function () {

            if (P.full.isFullScreen()) dom.addClass(this._container, "pano-fullscreen");
            else dom.removeClass(this._container, "pano-fullscreen");

            var w = P.width(this._container);
            var h = P.height(this._container);

            this.setSize(w, h);
        }
    }

    P.extend(pano.prototype , events);

    //factory
    P.pano = function (opts) {
        var dCfg = {"render": "auto", "type": "auto", debug: false, multires: false};
        var node = opts.node;
        opts = P.extend(dCfg, opts);
        var disRender = (opts.render.match(/^!(webgl|css|basic)/) || ["", ""])[1];
        if (disRender) opts.render = "auto";

        if (opts.render == "css" && !feature.css3d) opts.render == "auto";
        if (opts.render == "webgl" && !feature.webgl) opts.render == "auto";
        if (opts.render == "auto") {
            opts.render = "basic";
            if (feature.css3d && disRender != "css") opts.render = "css";
            if (feature.webgl && disRender != "webgl") opts.render = "webgl";
        }

        if (opts.type == "auto") {
            opts.type = "cube"
        }

        var p = new pano(node, opts);
        if (dCfg.debug) utils.debug(node , p);

        return p;
    };

    P.config = P.pano;

    return pano;
})