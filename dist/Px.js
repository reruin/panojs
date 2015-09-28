/**
 * Created by Administrator on 2014/10/10.
 */
var Px = window.Px = {};

var Tweener = P.require('P.base.utils.tweener'),
    feature = P.require('P.base.feature'),
    utils = P.require('P.base.utils'),
    dom = P.require('P.base.dom'),
    services = P.require('P.base.services'),
    anim = P.require('P.anim.Anim');

P.provide("P.control.AddressControl" , "P.control.Control",{
    initialize: function (opts) {
        P.setOptions(this, opts);
        this._initDom();
    },

    _initDom:function(){
        this._container = P.creat("div" , null , "pano-control-address", null, "transform: translateZ(1000000000000px);z-index:99999;;position: absolute; left: 0;top: 0;display:block;font-size:12px;text-shadow: rgba(0, 0, 0,0.8) 1px 1px 3px;color:#fff;font-family:arial,'microsoft yahei';padding:8px;text-align:left;");
        this._address = P.creat("div",null,"pano-control-ars",this._container,"border-bottom:rgba(255,255,255,0.6) solid 1px;padding:5px 0;");
        this._date = P.creat("div",null,"pano-control-imagedate",this._container,"padding:5px 0;");
        this.setDate();
    },

    setDate : function(v){
        this._address.innerHTML = v;
    },

    onAdd:function(){
        this._pano.addEventListener("pano_changed" , P.bind(this._onChangePano , this));
       // P.on(this._pano,"click", P.bind(this._onToggle , this));
    }
    ,

    _onChangePano : function(){
        var time = this._pano._panoData.imageDate;
        var copy = this._pano._panoData.copyright;
            copy = "&copy;</a href='#'>"+ copy + "</a>";
        var self = this;
        this._date.innerHTML = copy + "<span style='float:right;padding-left: 10px;'>拍摄时间:" + time+"</span>";

        services.geoCoder(this._pano.getPosition() , function(d){

            self.setDate(d);
        } , this._pano.options.provider.key)
    }


});

P.extra = {};
P.extra.Sound = function(el){
    this.init(el);
};

P.extra.Sound.prototype = {
    list : {},
    _container : null,
    _autoInit : false,
    singleInstance : P.base.feature.mobile,

    init:function(el){
        this._container = el;
        this._initAutoAudio();
    },
    _initAutoAudio : function() {

        //http://www.iandevlin.com/blog/2012/09/html5/html5-media-and-data-uri
        var event = feature.touch ? "touchend" : "mouseup";
        P.on(document, event, P.bind(function () {
            if (this._autoInit == true) return;
             var audio = this._creat();
             //audio.load("data:audio/mp3;base64,//uwxAADwAABpAAAACAAADSAAAAETEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=","audio_check",false,0);
             //audio.play();
            //alert();
            for (var i in this.list) {
                var audio = this.list[i];
                if (audio.autoplay && audio.paused) audio.play();
            }
            this._autoInit = true;

        }, this))
    },
    _creat :function(){
        var audio = P.creat("audio",null,null,this._container,"");
        return audio;
    }
    ,

    loadQueue:function(list){

    },
    _resumePlayList : [],
    load : function(url , id, repeat , vol , single){
        var aid = id || "audio"+(this.stamp++);

        if(this.singleInstance || single){
            for(var i in this.list){
                if(this.list[i].paused == false && i != aid)
                {
                    this._resumePlayList.push( i );
                    this.list[i].pause();
                }
            }
        }



        if(this.list[aid]){
            this.list[aid].src = url;

        }else {
            var audio = this._creat();
            audio.loop = repeat === true ? true : false;
            audio.autoplay = true;
            audio.src = url;
            //if(audio)
            this.list[aid] = audio;
        }

        if(this.singleInstance || single){
            //this.list[aid].addEventListener("ended" , P.bind(this._onResumeSingle, this));
            if(this.list[aid].bindSingle !== true) {
                P.on(this.list[aid], "ended", this._onResumeSingle, this);
                this.list[aid].bindSingle = true;
            }
        }

        if(vol) this.list[aid].volume = vol;
        if(this._autoInit) this.list[aid].play();
        else this._initAutoAudio(aid);
        return aid;
    },
    _onResumeSingle : function(e){
        if(this._resumePlayList.length)
        {
            var l = this.singleInstance ? 1 : this._resumePlayList.length;
            for(var i=0; i<l;i++)
            {
                this.list[ this._resumePlayList[i] ].play();
            }
        }
        //remove event
        P.un(e.target , "ended" , this._onResumeSingle);
        e.target.bindSingle = false;
    },

    stop : function(id)
    {
        if(this.list[id]){
            this.list[id].stop();
            this._container.removeChild(this.list[id]);
            delete this.list[id];
        }
    },
    pause : function(id){
        if(this.list[id]){
            this.list[id].pause();
        }
    },

    toggle : function(id){
        var audio = this.list[id];
        if(audio){
            if(audio.paused) audio.play();
            else audio.pause();
            return !audio.paused;
        }
    },

    pauseAll : function(){
        for(var i in this.list)
        {
            this.list[i].pause();
        }
        return false;
    },
    toggleAll : function(){
        var s;
        for(var i in this.list)
        {
           s =  this.toggle(i);
        }
        return s;
    },

    _test : function(){
        var k = 0 ,a = 0;
        for(var i in this.list)
        {
            if(this.list[i].paused == false) k++;
            a++;
        }
        document.title = k+"/"+a;
    }

}

P.provide("P.control.Sounder" , "P.control.Control", {
    list :{}, _autoInit : false,stamp:0, sound:null,
    initialize: function (opts) {
        P.setOptions(this, opts);
        this._initScene();
    },

    _initScene : function(){
        this._container = P.creat("div" , null , "pano-control-sounder", null);
        this._control = P.creat("a",null,"pano-sounder-control",this._container);
        this.sound = new P.extra.Sound(this._container);
    }
    ,
    onAdd : function(){
        this._pano
            .set("soundload" , P.bind(this.load, this))
            .set("soundstop" , P.bind(this.stop ,this))
            .set("soundpause" , P.bind(this.pause,this))
            .set("soundtoggle", P.bind(this.toggle,this))
            .addEventListener("pano_changed" , P.bind(this._onChangePano , this))
            .addEventListener("provider_load" , P.bind(this._onLoad , this));

        P.on(this._control,"click", P.bind(this._onPause , this));


        //setTimeout(P.bind(this._onLoad,this),1000)
        this._onLoad();
        this._onChangePano();
        //this._pano.playSound = P.bind(this.play, this);
    },
    _onLoad : function(){
        if(this._pano.options.provider)
        {
            var bg = this._pano.options.provider.options.data.basic.audio;
            if(bg)
                this.sound.load(bg,"sound_background",true,0.15)
        }

        //alert("loader")
    },
    _onPause : function(){

        var k = this.sound.toggleAll();

        if(k) dom.removeClass(this._control,"mute");
        else dom.addClass(this._control,"mute");
    },
    _onChangePano : function(){
        if(this._pano.options.provider) {
            var panoid = this._pano.getPano();
            var audio = this._pano.options.provider.data[panoid].raw.audio;
            if (audio)
                this.sound.load(audio, "scenesound", false, 0.75, true);
        }
    }
});


P.provide("P.control.Comment" , "P.control.Control",{
    options : {tick : 2000},
    initialize: function (opts) {
        P.setOptions(this, opts);
        this._initScene();
    },
    _initScene : function(){
        this._container = P.creat("div" , null , "pano-control-comment", null, "transform: translateZ(1000000000000px);z-index:9999999999;position: absolute; left: 0px; top:0;width:100%;height:25px;background:rgba(0,0,0,0.3);/*background-image: linear-gradient(to top,transparent,rgba(0,0,0,0.6));*/overflow:hidden;line-height:25px;font-size:12px;font-family:'microsoft yahei'");


        this._content = P.creat("div" , null,"pano-comment-content",this._container,"color:#fff;padding:0 5px;");

        this._comment1 = P.creat("div" , null,null,this._content,"text-overflow: ellipsis;white-space: nowrap;width:100%;overflow: hidden;");

        this._comment2 = P.creat("div" , null,null,this._content,"text-overflow: ellipsis;white-space: nowrap;width:100%;overflow: hidden;");

    },

    onAdd:function(){
        this.load();
        //var p = setTimeout(P.bind(this.draw , this) , 2000);
        this.draw();
    },

    draw : function(){

        Tweener.to(this._container,{
            time:0.6,scrollTop:25,
            onComplete : P.bind(this._updateShow , this)
        })
    },

    _updateShow : function(){
		setTimeout(P.bind(this.draw , this) , this.options.tick);
    
        if(this.data.length == 0 || this._size == 0)  return;

        var _tpl = "{user_nickname}: {text_excerpt}" , next = 0;

        this.index++;

        //end
        if(this.index == this._size) this.index = 0;

        next = (this._size == 1 || this.index == this._size-1) ? 0 : (this.index+1)
        //console.log(this.index+":"+next)
        this._comment1.innerHTML = utils.template(_tpl, this.data.reviews[this.index]);

        this._comment2.innerHTML = utils.template(_tpl, this.data.reviews[next]);

        this._container.scrollTop = 0;

        
    },

    _scrollHeight:0 , _size: 0,_step : 0, index:0, data:[],
    update:function(d){
        this.data = d;

        var html = "";
        if(d.status == "OK")
        {
            this._size = d.reviews.length;
            this.data = d;
            //this._updateShow();
        }

    },
    load:function(){
        var data = this.options.data;
        var self = this;

        if(typeof(data) == "string")
        {
            if(this.options.source == "qq")
            {
                services.getCommentFromQQ(data , function(d){
                    self.update(d);
                });
            }
        }
        else if(typeof(data) == "object")
        {
            self.update(d);
        }
        else
        {

            P.base.http.ajax({url:"assets/comment.txt?v=1" ,dataType:"json" ,
                success:function(d){

                    self.update(d);
                },
                error : function(){

                }
            });

        }


    }
});

P.provide("P.control.Popup" , "P.control.Control",{
    initialize: function (opts) {
        P.setOptions(this, opts);
        this._initScene();
    },

    _initScene : function(){
        this._container = P.creat("div" , null , "pano-control-popup", null, "transform: translateZ(1000000000000px);z-index:9999999999;position: absolute;left:0; top: 100%;opacity:0;width:100%;height:100%;background:#000;background: #fff;overflow-y: auto;line-height:1.75em;font-size:12px;font-family:'microsoft yahei'");
        this._close = P.creat("a",null,"pano-popup-close",this._container);

        this._content = P.creat("div" , null,"pano-popup-content",this._container,"padding:0px;width:100%;height:100%;");

        P.on(this._close ,"click" , P.bind(this._onClose , this));
    },

    _onClose:function(){
        P.css(this._container , {"top":"100%","opacity":0});
    },

    setContent:function(v){
        P.css(this._container , {"top":0,"opacity":1});
        var h = v;
        var c = document.getElementById(v);
        if(c)
        {
            var d = P.data(c,"data-page");
            if(d)  h = "<div style='-webkit-overflow-scrolling: touch;overflow-y: scroll;width:100%;height:100%; '><iframe src='"+d+"' style='width:100%;height:100%;border: none;'></frame></div>";
            else h = c.innerHTML;
        }

        this._content.innerHTML = h;
    },

    onAdd : function(){
        //this._pano
        this._pano.setPop = P.bind(this.setContent , this);
        this._pano.set("setPop" , P.bind(this.setContent , this))
    }
});

P.provide("P.control.Mix" , "P.control.Control",{
    /**
     * style
     */
    thumbHeight : 80,
    thumbWidth:120,
    padding:5,
    scrollWidth:100,
    _vw:1,

    initialize: function (opts) {
        P.setOptions(this, opts);
        this._initScene();
    },

    _initScene : function(){
        this._container = P.creat("div" , null , "pano-control-mix pano-animation-linear", null, "transform: translateZ(1000000000000px);z-index:9999999999;position: absolute; left: 0px; bottom: 10px;width:100%;height:80px;border-top:solid 1px rgba(255,255,255,0.5);border-bottom:solid 1px rgba(255,255,255,0.5);");
        //this._warp = P.creat()
        //this._wrap = P.creat("div",null,null,this._container,"position:relative;background: rgba(0,0,0,0.3);")
        this._content = P.creat("div" , null,"pano-mix-content",this._container)
        this._contentDiv = P.creat("div" , null,null,this._content,"height:80px;");

        this._ctrl = P.creat("div",null,"pano-mix-ctrl",this._container);
        this._expand = P.creat("a" , null , "pano-mix-expand pano-animation-linear" , this._ctrl);

        this._tips = P.creat("div",null,"pano-mix-tip",this._container);

        this._scene = P.creat("div" , null,"pano-mix-scene",this._container,"position: absolute;width:70px;height:80px;left: 0px;top:0;overflow-y:auto;overflow-x:hidden;background:rgba(0,0,0,0.1)");
        this._sceneDiv = P.creat("div" , null,null,this._scene,"width:70px;");
        //this._scrollBar = P.creat("div",null,"pano-mix-scroll" , this._content,"position:absolute;bottom:8px;left:36;width:"+this.scrollWidth+"px;height:2px;background:#eee;border-radius:0px;");
        //this._ctrl.innerHTML = "<a href='javascript:;' >Pre</a><a href='javascript:;' >Next</a><a href='javascript:;' >Toggle</a>";
        //this._test();

    },

    _regListeners : function(){
        //P.on(this._expand,"click", P.bind(this._onToggle , this));
        var event = feature.touch ? "touchstart" : "click";

        P.on(this._expand,event, P.bind(this._onToggle , this));
        P.on(this._content , "click", P.bind(this._onSwitch , this));
        P.on(this._content, "mousewheel", this._onMouseWheel, this);
        P.on(this._scene ,"click" , P.bind(this._onScene , this));
        P.on(this._scene, "mousewheel", this._onMouseWheelScene, this);
        P.on(this._pano , "pano_changed" , P.bind( this._onPanoChange , this));

        this._onPanoChange();
        //this.trigger();
        //P.on(window, "resize", this.onResize, this);

    },

    _onPanoChange:function(e){
        var id = this._pano._panoid;
        var d = this._pano.options.provider.data[id].raw;
        //console.log(this._pano.options.provider.data[id].panoData.tiles.getTileUrl)
        if(d.bestheading)
            this._pano.setPov({heading:d.bestheading});
    },

    onResize : function(){
        if( this._vw < (this._pano.viewWidth - 36) )
        {
            this._scrollBar.style.display = "none";
        }else
        {
            this._scrollBar.style.display = "inline";
        }
        //this._content.scrollLeft / (this._vw - this._pano.viewWidth + 36);

    },

    onAdd : function(){
        if(this.options.qq === true)
        {
            var self = this;
            P.base.services.getQQData(this.options.data , function(d){
                self.setData(d);
                self._regListeners();
            });
        }else{
            if(this.options.data) this.setData(this.options.data);
            this._regListeners();
        }

    },


    _test : function(){
        this._content.innerHTML = "<ul><li data='[[\"fly\",[33.03,15.31,0.675,1500]]]'><img src='http://krpano.com/panos/tokyo45gp/thumbs/thumb01.jpg' style='width:120px;height:80px;'><span>开始</span></li><li data='[[\"fly\",[-70.83,29.74,0.2,2000]]]'><img src='http://krpano.com/panos/tokyo45gp/thumbs/thumb09.jpg' style='width:120px;height:80px;'><span>People</span></li><li data='[[\"fly\",[-12.47,4.83,0.2,1500]]]'><img src='http://krpano.com/panos/tokyo45gp/thumbs/thumb04.jpg' style='width:120px;height:80px;'><span>Red Tower</span></li><li data='[[\"zoom\",[1,800]],[\"pan\",[42.48,33.46,1000]],[\"zoom\",[0.1,1800]]]'><img src='http://krpano.com/panos/tokyo45gp/thumbs/thumb03.jpg' style='width:120px;height:80px;'><span>Running Track</span></li><li data='[[\"zoom\",[0.8,1000]],[\"pan\",[151.22,16.11,1000]],[\"zoom\",[0.2,1200]]]'><img src='http://krpano.com/panos/tokyo45gp/thumbs/thumb06.jpg' style='width:120px;height:80px;'><span>Rush hour</span></li></ul>";
    },

    data : null,

    _tpl : "<li data-id='{id}' style=''><img src='{thumb}' style='width:120px;height:80px;'><span>{title}</span></li>",
    _tpl_f :"<li data-id='{id}' style='list-style: none;padding: 0px;width: 70px;height: 32px;line-height: 32px;cursor: pointer;color:#fff;'>{title}</li>",

    _getProviders : function(data){
        var id = data.provider.id;
        if(id == "HQT") return new P.provider.HQTProvider({server : "pano/" , maxDeep : 2 , onecMode : false});
        if(id == "Tencent" ) {return new P.provider.LocalProvider({size:data.basic.tileSize,data:data,key : this.options.key , maxpixelzoom:0 , onceMode:true , maxDeep:2 , ignoneLv0:true , renderPreview:true});}
        //return new P.provider.QQProvider({key : this.options.key , maxpixelzoom:2 , onceMode:false});
        if(id == "Local" ) {return new P.provider.LocalProvider({size:data.basic.tileSize,data:data,key : this.options.key , maxpixelzoom:data.basic.maxpixelzoom , onceMode:data.basic.onceMode , maxDeep:data.basic.level , ignoneLv0:data.basic.ignoneLv0});}
    },

    setData : function(d){
        this.data = d;

        this._pano.addProvider( this._getProviders(d)).setPano(d.scene[0].pano[0].id);

        this.setTitle(d);

        //console.log(d);
        /*if(this.options.qq === true){
            services.getQQScene(d.scene[0].id , function(md){

            });
        }*/

        var f="";
        // listTree
        d.scene_table  = {};
        for(var i=0;i< d.scene.length;i++){
            //console.log(d.scene[i])
            if( d.scene[i].id === undefined ){
                d.scene[i].id = i;
            }
            d.scene_table[d.scene[i].id ] = d.scene[i];

            f += utils.template( this._tpl_f, d.scene[i]);
        }

        this._sceneDiv.innerHTML = "<ul>"+f+"</ul>";

        dom.addClass(this._sceneDiv.firstChild.firstChild , "select");

        //this._contentDiv.firstChild.firstChild.style["padding-left"] = "0";

        this.setTitle(d.description);

        this.setContent(d.scene[0].pano);

    },

    setContent : function(d){

        var h = "" ;

        this._vw = (this.thumbWidth + this.padding*2) * d.length;

        for(var i=0;i< d.length;i++){
           d[i].thumb = this._pano.options.provider.getThumbById(d[i].id);
           h +=  utils.template( this._tpl, d[i]) ;
        }

        this._contentDiv.innerHTML = "<ul>"+h+"</ul>";
        this._contentDiv.style.width = this._vw+"px";

    },

    setTitle : function(v){
        this._tips.innerHTML = v;
    },

    _onScene : function(e){
        //alert(e.target)
        //var tar =  e.target || e.srcElement
        var id = P.data(e.target , "data-id");
        console.log(id)
        dom.removeClass(dom.query("li.select") , "select");
        dom.addClass( e.target || e.srcElement , "select");

        if(id!== undefined) this.setContent(this.data.scene_table[id].pano);

    },

    _onMouseWheelScene:function(e){
        var delta = dom.event.getWheelDelta(e);
        /*var d = this._content.clientWidth * .5;*/
        //console.log(delta)
        anim.loop({
            duration : 200,
            onUpdate : P.bind(this._onUpdateSceneScroll, this,-3*delta)
            //onComplete : P.bind(this._pano.render , this._pano)
        });
    },

    _onUpdateSceneScroll:function(v){
        console.log(v)
        this._scene.scrollTop += v;
    },
    _onMouseWheel:function (e) {
        var delta = dom.event.getWheelDelta(e);
        /*var d = this._content.clientWidth * .5;*/

        anim.loop({
            duration : 200,
            onUpdate : P.bind(this._onUpdateScroll, this,-3*delta)
            //onComplete : P.bind(this._pano.render , this._pano)
        });

    },

    _onUpdateScroll:function(v){
        this._content.scrollLeft += v;
        var value = this._content.scrollLeft / (this._vw - this._pano.viewWidth + 54);
        //console.log(value);
        //this._scrollBar.style["margin-left"] = (this._pano.viewWidth - 36 - this.scrollWidth) * value+"px";
    },

    _onAnimate:function(e){
        var cmd = eval(P.data(e.target.parentNode , "data"));
        var tl = this._pano.timeline;
        for(var i in cmd)
            tl[cmd[i][0]].apply(tl , cmd[i][1]);

    },

    _onSwitch : function(e){
        var id = P.data(e.target.parentNode , "data-id");

        if(id)
            this._pano.setPano(id);
    },

    _onToggle : function(){
        dom.toggleClass(this._container , "mini");//.addClass("mini");

    }

});


/*

P.object.Arrow = function(dir ,data){
    this.prefix = P.prefix.css;
    this.creat(dir , data);
    //return this;

}

P.object.Arrow.prototype = {
    creat : function(dir , data){
        this.dir = dir;
        //var rad = dir * Math.PI/180;
        //var dx = Math.sin(dir) , dy = d*Math.cos(dirR);
        this.el = P.creat("div",null,null,null,"",data);
        this.shadow = P.object.Arrow.shadow(dir , this.el, this.prefix , data);
        this.arrow = P.object.Arrow.arrow(dir , this.el , this.prefix , data);
    },

    draw : function(vw,vh,rx,ty,rz){
        var step = (vw > vh ? vh : vw)*.2;
        var ix = (vw-81)/2; var iy = (vh-54)/2;
        ix += Math.sin((this.dir+rz) * Math.PI/180) * 120;
        iy -= Math.cos((this.dir+rz) * Math.PI/180) * 120;
        */
/*this.el.style[this.prefix+"transform"] = "translate3d("+ix+"px,"+iy+"px,99999px) *//*
*/
/*rotateX("+rx+"deg)*//*
*/
/* translateY("+(-step)+"px)*//*
*/
/* rotateY("+this.dir+"deg)*//*
*/
/*";*//*

        this.el.style[this.prefix+"transform"] = "";
        this.arrow.style[this.prefix+"transform"] = "translate3d("+ix+"px,"+(iy)+"px,99999px) translateY("+(ty)+"px) perspective(800px) rotateX("+(rx)+"deg) rotateZ("+(rz+this.dir)+"deg) ";

        this.shadow.style[this.prefix+"transform"] = "translate3d("+ix+"px,"+iy+"px,99999px) translateY("+(ty+3)+"px) perspective(800px) rotateX("+(rx)+"deg) rotateZ("+(rz+this.dir)+"deg) ";
    }
}

P.object.Arrows = function(pano){
    this.init(pano);
}

P.object.Arrow.arrow = function(dir,container,prefix,data){
    var ar = P.creat("canvas" , null,null,container,"overflow: hidden; position: absolute; " + prefix + "transform: rotateX(" + dir + "deg) translateY(-120px);",data);
    ar.width = 81; ar.height = 59;
    var ctx = ar.getContext('2d');
    var ARROW_DATA = [[81,40],[67.5,54],[40,27],[13.5,54],[0,40],[40,0]];
    ctx.beginPath(); // 开始路径绘制
    ctx.fillStyle = "#ffffff";
    ctx.moveTo(ARROW_DATA[0][0], ARROW_DATA[0][1]);
    for(var i=1;i<ARROW_DATA.length;i++)
        ctx.lineTo(ARROW_DATA[i][0], ARROW_DATA[i][1]); // 绘制一条到200, 20的直线
    ctx.fill();
    //ctx.scale();
    return ar;
}

P.object.Arrow.shadow = function(dir,container,prefix,data){
    var ar = P.creat("canvas" , null,null,container,"overflow: hidden; position: absolute; " + prefix + "transform: rotateX(" + dir + "deg) translateY(-110px);",data);
    ar.width = 81; ar.height = 59;
    var ctx = ar.getContext('2d');
    var ARROW_DATA = [[81,40],[67.5,54],[40,27],[13.5,54],[0,40],[40,0]];
    ctx.beginPath();
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.moveTo(ARROW_DATA[0][0], ARROW_DATA[0][1]);
    for(var i=1;i<ARROW_DATA.length;i++)
        ctx.lineTo(ARROW_DATA[i][0], ARROW_DATA[i][1]); // 绘制一条到200, 20的直线
    ctx.fill();

    return ar;
}

P.object.Arrows.prototype = {
    init:function( pano){
        this._pano = pano;
        this.prefix = P.prefix.css;
        this.roadList = [];
        this.container = P.creat("div",null,"pano-road",this._pano._viewport,"position:absolute;left:0;top:0;");


        this._pano.addEventListener("render" , P.bind(this._render,this));

        this._pano.addEventListener("link_changed" , P.bind(this.onLinkChange,this));

        P.on(this.container , "click" , P.bind(this.onClick , this));

    },

    onClick : function(e){

        var id = P.data(e.target || e.srcElement, "data-id");
        this._pano.setPano(id);
    },

    onLinkChange:function(){

        var links = this._pano.getLinks();
        this.clear();
        this.update(links);
    },

    creat :function(dir , data){
        var p = new P.object.Arrow(dir ,data)
        this.container.appendChild(p.el );
        return p;
        */
/*return (shadow === true) ?
            P.object.Arrow.shadow(dir , data, this.container, this.prefix) :
            P.object.Arrow.arrow(dir , data, this.container, this.prefix);*//*

    },

    clear:function(){
        for(var i in this.roadList)
        {
            this.container.removeChild(this.roadList[i].el);
            this.roadList = [];
        }
    },

    update : function(v){
        for (var i = 0; i < v.length; i++) {

            //this.roadList.push( this.creat(v[i].dir , {"data-id":v[i].id} , true) );
            this.roadList.push( this.creat(v[i].dir , {"data-id":v[i].id}) );
        }
    },

    getTransform:function(){
        var cp =  -this._pano.pitch;;//0//this._pano._scene.calcPitch;
        var rx = cp>-30 ? 60 : (90 + cp);//console.log(this.calcPitch)
        //	-30 ~ -90 上升 40px; -30  ~ 0 匀速下降至 vH/2 - 90
        var ty = (cp<-30) ?　-40*(90+cp)/60 : (-40 + (this._pano.viewHeight*0.5 - 50)*(30+cp)/30);
        var vw = this._pano.viewWidth , vh = this._pano.viewHeight;
        //var shadow = dy-6
        //中心 下移 透视 旋转（先移动 后旋转,translate3d 设置z是为了 接收 鼠标事件，否则rotateZ后 z<0）
        return "translate3d("+(vw-81)/2+"px,"+(vh-54)/2+"px,99999px) translateY("+(ty)+"px) perspective(800px) rotateX("+rx+"deg) rotateZ("+(0-this._pano.heading)+"deg) ";
    },

    _render:function(){
        var cp =  -this._pano.pitch;;//0//this._pano._scene.calcPitch;
        var rx = cp>-30 ? 60 : (90 + cp);//console.log(this.calcPitch)
        //	-30 ~ -90 上升 40px; -30  ~ 0 匀速下降至 vH/2 - 90
        var ty = (cp<-30) ?　-40*(90+cp)/60 : (-40 + (this._pano.viewHeight*0.5 - 50)*(30+cp)/30);
        var vw = this._pano.viewWidth , vh = this._pano.viewHeight;
        var rz = 0-this._pano.heading;
        for(var i in this.roadList)
        {
            //console.log("rend:");console.log(this.roadList[i]);

            this.roadList[i].draw(vw,vh,rx,ty , rz);
            //.style[this.prefix+"transform"] = this.getTransform();
            //console.log(this.getTransform())
        }
       //console.log("RENDER")
    }
}
*/
