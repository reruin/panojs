/*PMC*/
// loader manager
(function(undefined,window){

    "use strict";

    var oriP = window.P,
        P = function(cfg){
            return P.config(cfg)
        };

    if (typeof module === 'object' && typeof module.exports === 'object') {
        module.exports = P;
    } else if (typeof define === 'function ' && define.amd) {
        define(P);
    }

    P.noConflict = function () {  window.P = oriP; return this;};

    P.version = '20150112';

    window.P = P;

    P.global = {};

    var loading = {};
    var modules = P.global;

    Date.now = Date.now || function () {
        return new Date().valueOf();
    };

    var L = function(){

        var v = Array.prototype.slice.call(arguments);
        for(var i in v)
        {
            console.log(v);
        }

    }

    var logger = {
        info:function(v){ console.log("%cINFO : "+v,"color:#0080ff"); },

        error : function(v){ console.log("%cERROR : "+v,"color:red"); },

        warn : function(v){ console.log("%cWARN : "+v,"color:orange"); },

        success : function(v){console.log("%cSUCCESS : "+v,"color:green");}
    }

    var getModule = function(module)
    {
        var src = module;
        if (/^P\./.test(module)) {
            src = src+'.js';

            if (P.MODULE_ROOT) {
                src = P.MODULE_ROOT + '/' + src;
            }
        }

        return src;
    };

    var extend = function (k) {
        var argus = Array.prototype.slice.call(arguments, 1) ,
            o = k || {} , src;
        for (var i = 0 , l = argus.length; i < l; i++) {
            src = argus[i] || {};
            if (typeof src == 'object') {
                for (var p in src) {
                    o[p] = src[p];
                }
            }
        }
        return o;
    }

    var include = function(imports, callback)
    {
        if (imports instanceof Array) {
            var i, len = imports.length;

            if (len) {
                var inc = function(index) {
                    include(imports[index], function() {
                        index++;
                        if (index < len) {
                            inc(index);
                        }
                        else {
                            callback();
                        }
                    });
                };

                inc(0);
            }
            else {
                callback();
                return;
            }
        }
        else if (imports == null) {
            callback(); return;
        }
        else {

            if (!modules.hasOwnProperty(imports)) {
                // 外部导入
                //console.log("r - req:"+imports)
                var r = require(imports);
                if(r){
                    modules[imports] = {object : r}
                    callback();
                    return;
                }
                var src = getModule(imports);

                var ele = document.createElement('script');
                ele.setAttribute('src', src);
                document.getElementsByTagName('head')[0].appendChild(ele);

                loading[imports] = {
                    name: imports,
                    src: src,
                    callback: callback
                };
            }
            else {
                callback();
                return;
            }
        }

    };

    var require = function(v) {
        var nss = v.split("."), cc = window, i, l;
        for (i = 0, l = nss.length; i < l && cc != undefined; i++) {
            cc = cc[nss[i]];
        }
        return cc;
    };

    //赋值继承
    function inherit_s(C,T,o){

        C.prototype = new T();
        C.prototype.constructor = C;

        for(var i in o){

            //掺元
            if (i == 'mixin')  extend(C.prototype, o.mixin);

            else if (i == 'static')  extend(C, o.static);

            else{
                //console.log(i);
                C.prototype[i] = o[i];
            }
        }

    }

    //继承
    function inherit(C, L) {
        var F = function () {};

        F.prototype = L.prototype;
        /* var proto = new F(); proto.constructor = C; C.prototype = proto;*/
        C.prototype = new F;

        // static vars
        for (var i in L) {
            if (L.hasOwnProperty(i) && i !== 'prototype') {
                C[i] = L[i];
            }
        }

        // 多重继承 、 对象混入(mixin)、静态赋值
        var i, l, o;
        for (i = 2, l = arguments.length; i < l; i++) {
            o = arguments[i];
            if (typeof o === "function") {
                o = o.prototype;
            }
            extend(C.prototype, o);

            if (o.mixin)  extend(C.prototype, o.mixin);

            if (o.static)  extend(C, o.static);

        }
    };

    function nclass() {
        var len = arguments.length;
        var L = arguments[0];
        var F = arguments[len - 1];

        /*
         var C = function(){
         if(L.prototype.initialize) L.prototype.initialize.apply(this, arguments);
         }*/

        var C = typeof F.initialize == "function" ?
            F.initialize :
            function () {
                L.prototype.initialize && L.prototype.initialize.apply(this, arguments);
            };

        if (len > 1) {
            var newArgs = [C, L].concat(Array.prototype.slice.call(arguments).slice(1, len - 1), F);
            inherit.apply(null, newArgs);
        } else {
            C.prototype = F;
        }

        return C;
    };

    /**
     * 模块加载
     */

    function module(mod, dependencies, factory){

        modules[mod] = {object:undefined}

        include(dependencies, function() {

            var nc = mod.split("."), pnc, o = window , i, l = nc.length;
            for (i = 0 ; i < l-1; i++) {
                o = o[nc[i]] = o[nc[i]] || {};
            }
            var reqs = [];
            for(var j=dependencies.length-1;j>=0;j--)
            {
                //console.log("req:"+dependencies[j])
                reqs[j] = require(dependencies[j]);
            }
            modules[mod].object = o[nc[i]] = factory.apply(factory,reqs);//, reqs

            //正在加载
            if (module in loading) {
                var callback = loading[mod].callback;
                delete loading[mod];
                callback();
            }
        });
    }

    /**
     *  传统继承
     */
    function provide(ns, pns, props) {

        var nc = ns.split("."), pnc, o = window , i, l , argus;

        if (typeof pns == "string" && pns != "")  pnc = P.require(pns);

        for (i = 0, l = nc.length - 1; i < l; i++) {
            o = o[nc[i]] = o[nc[i]] || {};
        }

        if (arguments.length > 1) {
            argus = props || {};
            o[nc[i]] = typeof pnc == "function" ?
                nclass(pnc, argus) :
                P.extend({}, pns);
        } else {
            o[nc[i]] = {};
        }

    };

    /**
     * 模块继承
     * @type {module}
     */
    function use(ns, pns,dep, props) {

        var argus = props || {} , pnc = P.require(pns);
        var nc = nclass(pnc, argus);
        P.module(ns,dep,nc);
    };

    var isarray = Array.isArray || function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    };

    /**
     * 新增工厂
     */
    function factory(v , cls){
        P[v] = cls;
    }

    P.factory = factory;
    P.module = module;
    P.require = require;
    P.provide = provide;
    P.extend = extend;
    P.use = use;
    P.isArray = isarray;
    P.inherit = inherit_s;
    P.logger = logger;

})(undefined, window);

P.module("P.anim.Anim",[],function(){
    function loop(options) {
        var callback = options.onUpdate;
        var duration = options.duration ||  Number.POSITIVE_INFINITY;
        var oncomplete = options.onComplete;
        var start = P.now();

        var handler = function () {
            if (P.now() - start <= duration) {
                callback();
                P.requestAnimationFrame( handler );
            } else {
                //complete
                if(oncomplete){  oncomplete();}
                handler = null;
            }
        };
        P.requestAnimationFrame( handler );
    }

    var easing = {
        inAndOut : function(a){return 3*a*a-2*a*a*a},

        linear : function(t) { return t; },

        upAndDown : function(t) {
            if (t < 0.5) {
                return easing.inAndOut(2 * t);
            } else {
                return 1 - easing.inAndOut(2 * (t - 0.5));
            }
        }
    };

    return {
        'loop':loop,
        'easing' : easing
    }
})
P.module('P.anim.Timeline',['P.anim.Anim'],function(anim){
     function timeline(pano){
        this.pano = pano;
        this.frameState = pano._frameState;
        this.fn = {};
        this.runing = false;
        this.pano.frameSnapshot();
        this.start = 0;
        this.totalDuration = 0;
        this.count = 0;
    }


    timeline.prototype = {
        /**
         * 动作类型
         *
         */
        wait : function(time)
        {
            this.totalDuration += time;
            return this;
        },

        pan : function(heading,pitch, duration){
            return this.addTo({pan:{heading:heading , pitch : pitch , duration:duration}});
        },

        zoom : function(zoom , duration){
            return this.addTo({zoom:{zoom : zoom , duration:duration}});
        },

        bounce:function(zoom , duration ){
            return this.addTo({bounce:{zoom : zoom , duration:duration}});
        },

        fly:function(heading , pitch , zoom , duration , isbounce){

            var ob = {
                pan:{heading:heading , pitch : pitch , duration:duration}
            };
            ob[isbounce === true ? "bounce" :"zoom"] = {zoom : zoom , duration:duration};
            return this.addTo(ob);
        },

        creat : function(type , d , duration, start){
            if(type == "pan")
            {
                var ob =  {type : "pan", start:start , duration : duration , easing: "linear",easingFn:anim.easing.linear, from:this.frameState.pan};
                if(d.heading !== null) ob.heading = d.heading;
                if(d.pitch !==null) ob.pitch = d.pitch;
                return ob;
            }else if(type == "zoom")
            {
                return {type : "zoom", start:start , duration : duration , zoom : d.zoom , easing: "linear",easingFn:anim.easing.linear, from:this.frameState.zoom};
            }else if(type == "bounce"){
                return {type : "zoom", start:start , duration : duration , zoom : d.zoom , easing: "upAndDown",easingFn:anim.easing.upAndDown, from:this.frameState.zoom}
            }
        },

        addTo : function(o){
            o = o || {};
            var dur = 0;
            if(this.runing == false) {this.start = P.now();this.totalDuration = 0;}
            var start = this.start + this.totalDuration;

            for(var i in o)
            {
                var d = o[i];
                var dur_ = d.duration || 1000;
                dur = Math.max( dur , dur_);
                this.add( this.creat( i , d , dur_ , start) );
                // console.log("start:"+this.totalDuration+",duration:"+dur_+" for " + i)
            }

            this.totalDuration += dur;

            return this;
        },

        _step : function(a , frameState){
            // console.log(frameState)
            // console.log("here is : "+(frameState.time - start)+", start:"+start+",duration:"+duration)
            //console.log("====>"+key)

            var key = a.type;
            if (frameState.time < a.start) {
                frameState.animate = true;
                frameState.process[key] = true;
                //获取值 快照
                a.from = frameState[key];

                return true;
            }
            else if (frameState.time < a.start + a.duration) {
                frameState.animate = true;
                frameState.process[key] = true;


                var easeFn = (typeof(a.easing) == 'function') ? a.easing : anim.easing[a.easing];

                var delta = easeFn((frameState.time - a.start) / a.duration); //[0,1]
                if(key == "pan"){
                    var deltaX = a.heading - a.from[0];
                    var deltaY = a.pitch - a.from[1];
                    frameState.pan.heading = a.from[0] + delta * deltaX;
                    frameState.pan.pitch = a.from[1] + delta * deltaY;
                    //console.log("animate "+key+":"+frameState.pan.heading+","+ frameState.pan.pitch)

                }else
                {
                    frameState[key] = a.from + delta * (a[key] - a.from);
                    //console.log("animate :"+key+":"+frameState[key])
                }

                //console.log("sourceX :"+sourceX);


                return true;
            } else {
                frameState.process[key] = false;
                return false;
            }
        },

        inTimeline:function(v){

        },

        update : function(){
            this.frameState.time = P.now();
            var change = false;
            for(var i in this.fn)
            {
                //console.log(this.fn[i])
                var m = this._step( this.fn[i], this.frameState);
                if(m == false) this.remove(i);
                change = change || m;
            }

            if( change )
            {
                //console.log(this.frameState.pov[0])
                if(this.frameState.process.pan) this.pano.setPov(this.frameState.pan ,false , false);
                if(this.frameState.process.zoom) this.pano.setZoom( this.frameState.zoom , false, false, this.frameState.lookat); //console.log( this.frameState.zoom )}
                P.requestAnimationFrame( P.bind( this.update, this) );

            }else{
                //TODO 是否做检测
                this.pano.render(true);

                this.timeline = null;

                this.runing = false;
            }
        }
        ,

        add : function(animate){
            //console.log(this.fn[animate])
/*            if(typeof(animate.easing) == 'function'){
                animate.easingFn =
            }*/
            this.fn[++this.count] = animate;

            if(this.runing == false)
            {
                this.pano.frameSnapshot();
                P.requestAnimationFrame( P.bind( this.update, this) );
                this.runing = true;
            }
            return this.count;
        },

        remove : function(i){
            if(this.fn[i]){
                delete this.fn[i];
            }
            this.pano.frameSnapshot();

        },
        clear : function(){
            for(var i in this.fn)
                delete this.fn[i];
            this.pano.frameSnapshot();
        },

        has : function(v) { return (v in this.fn) }
    };

    return timeline;
})
P.module("P.base.code",[],function(){
    return {

        decode: function (v , num) {
            var formatTime = function(v){
                if(v.length==6)
                    return "20"+v.substring(0, 2)+"-"+v.substring(2, 4) + "-" + v.substring(4, 6);

                var y = v.substring(0, 4) , mo = v.substring(4, 6) , d = v.substring(6, 8)
                    , h = v.substring(8, 10) , m = v.substring(10,12);
                return y+"-"+mo+"-"+d+" "+h+":"+m;
            };

            var fix = function (o, n) {
                var l = o.length;
                if (l < n) o = new Array(n - l + 1).join("0") + o;
                return o
            }

            // 27位短编码

            var pre1 = fix(parseInt(v.substring(0, 1)).toString(2) , 3);

            var use_pre = pre1.charAt(0) == "0" ? false : true;
            var lat_pre = pre1.charAt(1) == "0" ? false : true;
            var lng_pre = pre1.charAt(2) == "0" ? false : true;


            var time, lat, lng, dir, indent;

            if(v.length == 38)
            {
                var pre2 = fix(parseInt(v.substring(1, 2)).toString(2) , 3);
                var ident = "";
                var time_pre = pre2.charAt(0) == "0" ? false : true;
                var ident_pre = pre2.charAt(1) == "0" ? false : true;
                time = (time_pre?"bc ":"")+formatTime(v.substring(2, 14));
                lat = parseFloat( v.substring(14, 22) ) / 1e6;
                lng = parseFloat( v.substring(22, 31) ) / 1e6;
                dir = parseInt(v.substring(31,34));
                if(lat_pre) lat *= -1;
                if(lng_pre) lng *= -1;
                // alert(ident_pre)
                if(ident_pre)
                {

                    ident = v.substring(34, 38);
                }

                return {time: time, lat: lat, lng: lng, dir: dir , copyright : ident}
            }

            if(v.length == 27)
            {
                time = formatTime(v.substring(1,7));
                lat = parseFloat( v.substring(7,15) ) / 1e6;
                lng = parseFloat( v.substring(15,24) ) / 1e6;
                dir = parseInt(v.substring(24,27));
                if(lat_pre) lat *= -1;
                if(lng_pre) lng *= -1;

                return {time: time, lat: lat, lng: lng, dir: dir , copyright : ""}
            }


        }//decode("52qgg7ycyUocyUFvkq_")
        ,
        encode: function (v , short) {
            v = v || {};
            var fix = function (o, n) {
                var l = o.length;
                if (l < n) o = new Array(n - l+1).join("0") + o;
                return o
            }

            var fix_0 = function(v){ return (v<10)?("0"+v):(""+v); }
            //alert(fix_0(0))
            var ts = new Date(v.time.replace(/bc\s+/i, ""));
            var time = ts.getFullYear() + fix_0( ts.getMonth()+1) + fix_0(ts.getDate()) + fix_0(ts.getHours()) + (fix_0(ts.getMinutes())),
                lat = Math.floor(v.lat * 1e6) ,
                lng = Math.floor(v.lng * 1e6) ,
                dir = fix(v.dir+"",3),
                alt = fix(v.alt+"",4),
                ident = v.ident || ""; // 5

            //alert(v.ident === undefined)
            // BC Time
            var time_pre = (/bc/i.test(v.time) ? 1 : 0 );
            var lat_pre = lat < 0 ? 1 : 0;
            var lng_pre = lng < 0 ? 1 : 0;
            lat = fix(""+Math.abs(lat),8) ; lng = fix(""+Math.abs(lng),9);
            var use_pre = v.m === true ? 0 :1;
            var ident_pre = v.ident === undefined ? 0 : 1;
            var pre1 = parseInt([use_pre, lat_pre , lng_pre].join("") , 2).toString(10);
            var pre2 = parseInt([time_pre ,ident_pre,0].join(""),2).toString(10);
            if(short === true) {

                time = time.substring(2,8);//console.log("" + lat)
                return "" + pre1 + time + lat + lng + dir;
            }
            return "" + pre1 + pre2 + time + lat + lng + dir + ident;


        }//;console.log(encode({time:"2013-01-01 00:00",lat:-34.123456,lng:-114.123456,alt:-1312,dir:90}))

    };
})
/**
 * Created by Administrator on 2014/11/6.
 */
//特性
P.module("P.base.feature",[],function(){
    var pf = navigator.platform.toLowerCase() , ua = navigator.userAgent;//.toLowerCase();

    var retina = ('devicePixelRatio' in window && window.devicePixelRatio > 1) ||
            ('matchMedia' in window && window.matchMedia('(min-resolution:144dpi)') &&
                window.matchMedia('(min-resolution:144dpi)').matches),
        msPointer = window.navigator && window.navigator.msPointerEnabled &&
            window.navigator.msMaxTouchPoints && !window.PointerEvent,
        pointer = (window.PointerEvent && window.navigator.pointerEnabled && window.navigator.maxTouchPoints) ||
            msPointer;
    var doc = document.documentElement,
        ie = 'ActiveXObject' in window,
        ielt9 = ie && !document.addEventListener,
        android = ua.indexOf('Android') >= 0,
        android23 = ua.search('android [23]') !== -1,
        webkitver = parseInt((/WebKit\/([\d]+)/.exec(ua) || 0)[1],10) || 0,
        ie3d = ie && ('transition' in doc.style),
        webkit3d = ('WebKitCSSMatrix' in window) && ('m11' in new window.WebKitCSSMatrix()) && !android23,
        gecko3d = 'MozPerspective' in doc.style,
        opera3d = 'OTransition' in doc.style,
        css3d = ie3d || webkit3d || gecko3d || opera3d;
    var mobile = typeof orientation !== undefined + '';

    var touch = pointer || ("ontouchstart" in doc);
    ///AppleWebKit\/([\d.]+)/.exec(navigator.userAgent)
    var webgl = (function(){
        var support = true && !!window.WebGLRenderingContext;
        var pre = ["webgl",	"experimental-webgl","webkit-3d","moz-webgl"];
        var gl;
        var canvas = document.createElement("canvas");
        for (var i = 0; i < pre.length; i++) {
            try {
                gl = canvas.getContext(pre[i]);
            }
            catch(e) {}
            if (gl) {support = true; break;}
        }
        if(gl == null) support = false;
        gl = null; canvas = null;
        return {
            support : support,
            prefix : i==pre.length?null:pre[i]
        }
    }())

    return {
        ie: ie,
        ielt9: ielt9,
        retina: retina,
        msPointer: msPointer,
        pointer: pointer,
        chrome: /chrome/.test(ua),
        webkit: /webkit/.test(ua),
        mobile: mobile,
        webgl: webgl.support,
        webglprefix: webgl.prefix,
        css3d: css3d,
        touch: touch,
        webkitver:webkitver,
        androidnative : android && webkitver <= 534,
        canvas : !!document.createElement('canvas').getContext
    }
})
/**
 * Created by Administrator on 2014/11/6.
 */

P.module("P.base.dom",["P.base.feature"],function(browser){
    //console.log("-------->")
    //console.log(P)
    // 事件管理器
    var event = {
        on: function (el, type, fn, scope) {
            var id = P.stamp(fn),
                key = '__pano_' + type + id,
                handler;
            var msTouch = browser.msTouch;
            handler = function (e) {
                /* ie8 hack */
                if(browser.ielt9) e.target = e.srcElement;
                return fn.call(scope || el, e);
            };

            //触摸类事件重载handler
            if (type == "swipe" || type == "pinch") {
                //暂不处理
                return;
                var orihandler = handler;
                handler = function () {

                }
            }

            // IE PointerEvent 事件处理
            if (browser.pointer && type.indexOf('touch') === 0) {
                return this.addPointerListener(el, type, handler, id);
            }

            if (el.addEventListener) {

                if (type === 'mousewheel') {
                    // firfox
                    el.addEventListener('DOMMouseScroll', handler, false);
                    el.addEventListener(type, handler, false);
                } else {
                    el.addEventListener(type, handler, false);
                }

            } else if (el.attachEvent) {
                el.attachEvent('on' + type, handler);
            } else {
                el["on" + type] = handler;
            }

            //保存 handler
            el[key] = handler;

            return this;
        },
        // (HTMLDomElement, String, Function)
        has : function(el , type){


        },
        un: function (el, type, fn) {

            var id = P.stamp(fn),
                key = '__pano_' + type + id,
                handler = el[key];

            if (!handler) {
                return this;
            }

            if (browser.pointer && type.indexOf('touch') === 0) {
                this.removePointerListener(el, type, id);
            } else if (el.removeEventListener) {

                if (type === 'mousewheel') {
                    el.removeEventListener('DOMMouseScroll', handler, false);
                    el.removeEventListener(type, handler, false);

                } else {
                    el.removeEventListener(type, handler, false);
                }
            } else if (el.detachEvent) {
                el.detachEvent('on' + type, handler);
            } else {
                delete el["on" + type];
            }

            delete el[key];

            return this;
        },
        trigger: function (el, type, id, e) {
            var key = '__pano_' + type + id,
                handler = el[key];
            if (handler) handler(e);

            return this;
        },
        stopPropagation: function (e) {

            if (e.stopPropagation) {
                e.stopPropagation();
            } else {
                e.cancelBubble = true;
            }

            return this;
        },

        disableScroll: function (el) {
            var stop = event.stop;
            return P.Event
                .on(el, 'mousewheel', stop)
                .on(el, 'MozMousePixelScroll', stop);
        },

        preventDefault: function (e) {

            if (e.preventDefault) {
                e.preventDefault();
            } else {
                e.returnValue = false;
            }
            return this;
        },

        stop: function (e) {
            return event
                .preventDefault(e)
                .stopPropagation(e);
        },
        getWheelDelta: function (e) {

            return  e.wheelDelta ?
                e.wheelDelta / 120 :
                e.detail ?
                    e.detail / -3 :
                    0
        }
    }


// 指针事件( Pointer Event , IE gt10)
// rel : http://www.w3.org/TR/pointerevents/ ( w3c草案 )
    P.extend(event, {

        POINTER_DOWN: browser.msPointer ? 'MSPointerDown' : 'pointerdown',
        POINTER_MOVE: browser.msPointer ? 'MSPointerMove' : 'pointermove',
        POINTER_UP: browser.msPointer ? 'MSPointerUp' : 'pointerup',
        POINTER_CANCEL: browser.msPointer ? 'MSPointerCancel' : 'pointercancel',
        _touches: [],

        addPointerListener: function (el, type, handler) {

            switch (type) {
                case 'touchstart':
                    return this.addPointerListenerStart(el, type, handler);
                case 'touchend':
                    return this.addPointerListenerEnd(el, type, handler);
                case 'touchmove':
                    return this.addPointerListenerMove(el, type, handler);
                default:
                    throw 'Unknown touch event type';
            }
        },
        addPointerListenerStart: function (el, type, handler) {
            var touches = this._touches , key = '__pano_touchstart' + id;

            var cb = function (e) {
                /*
                 e : pointevent
                 pointerId: long, defaulting to 0,
                 width: long,
                 height : long
                 pressure: float
                 tiltX : long
                 tiltY: long
                 pointerType: String (mouse / pen / touch ...)
                 isPrimary: boolean, defaulting to false
                 */
                var alreadyInArray = false;
                for (var i = 0, l = touches.length; i < l; ++i) {
                    if (touches[i].pointerId == e.pointerId) {
                        alreadyInArray = true;
                        break;
                    }
                }
                if (!alreadyInArray) touches.push(e);

                e.touches = touches.slice();
                handler(e);
            };

            el[key] = cb;
            el.addEventListener(this.POINTER_DOWN, cb);

            //后续事件
            //这部分可以统一绑定到 body 上
            var internalCb = function (e) {
                for (var i = 0, l = touches.length; i < l; ++i) {
                    if (touches[i].pointerId == e.pointerId) {
                        touches.splice(i, 1);
                        break;
                    }
                }
            };
            //没有绑定 el[key]
            el.addEventListener(this.POINTER_UP, cb);
            //document.documentElement.addEventListener('MSPointerUp', internalCb, false);
        },

        // (HTMLDOMElement , String , Function)
        addPointerListenerMove: function (el, type, handler, id) {
            var touches = this._touches , key = '__pano_touchmove' + id;
            var cb = function (e) {

                //没有按下时 不触发, mouse操作不触发
                if ((e.pointerType == e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons == 0)  return;

                //按下但未移动不触发
                if (touches.length == 1 && touches[0].pageX == e.pageX &&
                    touches[0].pageY == e.pageY) {
                    return;
                }
                for (var i = 0, ii = touches.length; i < ii; ++i) {
                    if (touches[i].pointerId == e.pointerId) {
                        touches[i] = e;
                        break;
                    }
                }

                e.touches = touches.slice();
                handler(e);
            };
            el[key] = cb;
            el.addEventListener(this.POINTER_MOVE, cb, false);

            return this;
        },
        addPointerListenerEnd: function (element, type, handler, id) {
            var touches = this._touches , key = '__pano_touchend' + id;

            var cb = function (e) {

                for (var i = 0, l = touches.length; i < l; ++i) {
                    if (touches[i].pointerId == e.pointerId) {
                        touches.splice(i, 1);
                        break;
                    }
                }

                e.touches = touches.slice();
                handler(e);
            };
            el[key] = cb;
            el.addEventListener(this.POINTER_UP, cb, false);
            el.addEventListener(this.POINTER_CANCEL, cb, false);
        },
        removePointerListener: function (el, type, id) {
            var handler = el["__pano_" + type + id];
            switch (type) {
                case 'touchstart':
                    el.removeEventListener(this.POINTER_DOWN, handler, false);
                    break;
                case 'touchmove':
                    el.removeEventListener(this.POINTER_MOVE, handler, false);
                    break;
                case 'touchend':
                    el.removeEventListener(this.POINTER_UP, handler, false);
                    el.removeEventListener(this.POINTER_CANCEL, handler, false);
                    break;
            }
            return this;
        }
    });


    var query = function(id){
        return document.querySelector(id);
    }

    var _$ = function (id) {
        return document.getElementById(id);
    }

    var data = function(el , key , val){
        if(val === undefined)
        {
            return el.getAttribute(key);
        }else{
            el.setAttribute(key, val);
        }

    }

    var creat = function (tag, id, cls, parent, style, data) {
        var el = document.createElement(tag);
        if (id) el.id = id;
        if (cls) el.className = cls;
        if (style) el.setAttribute("style", style);
        if (data) {
            for (var key in data)
                el.setAttribute(key, data[key]);
        }
        if (parent) parent.appendChild(el);
        return el;
    }

    var fullApi = (function () {

        var vendors = 'khtml ms o moz webkit'.split(' '),
            l = vendors.length , support = false;
        //native support
        if (document.cancelFullScreen != undefined) {
            support = true;
        } else {
            // vendor prefix support
            for (var i = 0; i < l; i++) {
                var vendor = vendors[i];
                if (document[vendor + 'CancelFullScreen' ] != undefined) {
                    support = true;
                    break;
                }
            }
        }

        return {
            vendor: vendor,
            support: support,
            requestFullScreen: function (ele) {
                return (this.vendor === '') ? ele.requestFullScreen() : ele[this.vendor + 'RequestFullScreen']();
            },
            cancelFullScreen: function () {
                return (this.vendor === '') ? document.cancelFullScreen() : document[this.vendor + 'CancelFullScreen']();
            },
            isFullScreen: function () {
                return (document.fullScreen || document.webkitIsFullScreen || document[this.vendor + 'FullScreen']) == true
            }
        }
    })()

    var ancestor = function (dom, a) {
        if (a == "document") return true;
        var p = (typeof(dom) == "string" ? $(dom) : dom).parentNode , b = P.$("document") , a = P.$(a)

        while (p != b) {
            if (p == a) return true;
            p = p.parentNode;
        }
        return a == b
    }

    var getPosition =function (el) {
        return P.point(0, 0)
    }

    //css : function (ele, key, value) { return  ele.currentStyle ?  ele.currentStyle[key] :  window.getComputedStyle(ele)[key]; }

    var css = function (ele, key) {
        if (typeof(key) == "object") {
            for(var i in key) {ele.style[i] = key[i];}
        }
        else
            return  window.getComputedStyle ? window.getComputedStyle(ele)[key] : ele.currentStyle ? ele.currentStyle[key] : undefined;
    }

    var width = function(el){
        var b = el.getBoundingClientRect()
        return b.right - b.left;
    }

    var height = function(el){
        var b = el.getBoundingClientRect()
        return b.bottom - b.top;
    }

    //ref : https://developer.mozilla.org/en-US/docs/Web/API/Element.classList
    var hasClass = function (el, cls) {//alert(obj.className)
        return  el.classList ?
            /\s/.test(cls) ? false : el.classList.contains(cls) :
            (new RegExp('(\\s|^)' + cls + '(\\s|$)')).test(el.className);
    }

    var addClass = function (el, cls) {
        if (!hasClass(el, cls)) {
            if (el.classList) el.classList.add.apply(el.classList, cls.split(" "));
            else el.className += " " + cls;
        }
    }

    var removeClass = function (el, cls) {
        if (hasClass(el, cls)) {
            if (el.classList)
                el.classList.remove(cls);
            else {
                var l = el.className.split(/\s+/);
                for (var i = l.length - 1; i >= 0; i--)
                    if (l[i] == cls) l.splice(i, 1)
                el.className = l.join(" ");
            }
        }
    }
    var toggleClass =function (el, cls) {
        hasClass(el, cls) ? removeClass(el, cls) : addClass(el, cls)
    }


    P.full = fullApi;
    P.creat = creat;
    P.css = css;
    P.width = width;
    P.height = height;
    P.$ = _$;
    P.data = data;
    P.event = event;
    P.on = event.on;
    P.un = event.un;


    return {
        $:_$,
        query:query,
        event:event,
        data:data,
        creat:creat,
        full:fullApi,
        css:css,
        width:width,
        height:height,
        addClass:addClass,
        removeClass:removeClass,
        toggleClass:toggleClass,
        getPosition: getPosition,
        on:event.on,
        un:event.un

    }
})

//用于事件混入 mixin events
P.module("P.base.events",[],function(){
    return {
        listeners: {},
        on: function (obj, scope) {
            for (var i in obj)
                this.addEventListener(i, obj[i], scope);
            return this;
        },

        un: function (obj) {
            for (var i in obj)
                this.removeEventListener(i, obj[i]);
            return this;
        },

        addEventListener: function (type, handler, scope) {
            var listeners = this.listeners[type];
            if (!listeners) {
                listeners = [];
                this.listeners[type] = listeners;
            }
            var listener = {instance: this, type: type, handler: handler, scope: scope || this};
            listeners.push(listener);
            return this;
        },
        removeEventListener: function (type, handler) {
            var listeners = this.listeners[type];
            if (listeners != null) {
                for (var i = 0, l = listeners.length; i < l; i++) {
                    if (listeners[i].handler == handler) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
            return this;
        },
        clearEventListeners: function (type) {
            var listeners = this.listeners[type];
            if (listeners != null) {
                for (var i = 0, len = listeners.length; i < len; i++) {

                    this.removeEventListener(type, listeners[i].handler)

                }
                this.listeners[type] = [];
            }

            return this;
        },
        trigger: function (type, evt) {
            var listeners = this.listeners[type] , continueChain;
            // fast path
            if (!listeners || listeners.length == 0) return this;

            evt = evt || {};
            evt.target = this;
            if (!evt.type)  evt.type = type;
            // copy array
            listeners = listeners.slice();
            //alert(listeners.length)
            for (var i = 0, len = listeners.length; i < len; i++) {
                var callback = listeners[i];

                continueChain = callback.handler.call(callback.scope, evt);
            }
            return this;
        }
    }
})
P.module("P.base.http" , [],function(){
    var LoaderQueue = function (opts) {
        opts = opts || {};
        this.thread = opts.thread || 5;
        this.onUpdate = opts.onUpdate;
        this.onComplete = opts.onComplete;

        //初始化下载线程
        this.instances = [];
        for (var i = this.thread; i--;)
            this.instances[i] = new thread(this._next, this , this._error);


        this.task = []; // 任务列表
        this.free = true; // 加载器空闲
        this.status = 0;//加载器状态
    }

    LoaderQueue.prototype = {
        add: function (list) {
            this.task = list;
            this.status = 1;
            this._check()._start();
        }
        ,
        find: function (url) {
            for (var i = this.task.length; i--;) {
                if (this.task[i].url == url) return i;
            }
            return -1;
        },

        //检查 下载线程中 是否包含 队列项目 ，是则做以标记
        _check:function(){
            var index, i;
            for (i = this.instances.length; i--;) {
                if (this.instances[i].free !== true) {
                    index = this.find(this.instances[i].url);
                    if(index >= 0)
                        this.task[index].loading = true;
                }
            }
            return this;
        },

        remove: function (id) {

        },

        clear: function () {
            /*for (var i = this.thread; i--;)
                this.instances[i] = new thread(this._next, this , this._error);*/
            for(var i in this.task)
            {

            }
            this.task = [];
            this.status = 0;
        },

        _start: function () {
            this.free = false;

            for (var i = this.instances.length; i--;) {
                // 将任务分配到空闲进程
                if (this.instances[i].free) {
                    var q = this.setTask(this.instances[i]);
                    //已经没有任务
                    if (q == -1) {
                        return this;
                    }
                }
            }
            // 已经没有空闲进程
            return this;
        },
        /**
         * 加任务加入线程，返回任务id
         */

        setTask : function(thread){
            for (var i = 0, l = this.task.length; i < l; i++) {
                var itask = this.task[i];
                if (itask.loading !== true) {
                    itask.loading = true;
                    thread.start( itask );
                    return i;
                }
            }
            return -1;
        },


        // load 失败
        _error:function(thread){
            var index = this.find(thread.url);
            if (index != -1)
                this.task.splice(index, 1);
            else
                ;
            task.free = true;
        },

        _next: function (thread) {
            //根据下载线程 id 查找任务项
            var index = this.find(thread.url);

            //存在 则删除任务项
            if ( index >= 0 ){
                this.task.splice(index, 1);
                this.onUpdate(thread.data , thread.content);  //回调更新
            }

            //释放线程
            thread.free = true;

            //加任务加入线程，并判断 是否所有任务都已完成
            if( this.setTask(thread) == -1 ){
                this.free = true;
                this.status = 0;
                this.onComplete && this.onComplete();
            }
        }
    }

    function thread(cb, scope , error) {
        this.free = true;
        this.data = null;
        this.content = new Image();
        //this.content.crossOrigin = 'anonymous';
        this.retry = 3;
        this.id = "";
        this.fn = P.bind(cb, scope, this);
        this.error = P.bind(error,scope,this);
        this.url = '';
        this.start = function (o) {
            this.free = false;
            this.retry = 3;
            this.data = o;
            this.id = o.id;// this.url = o.url;
            this.content.src = this.url = o.url;
        };

        this.onerror = function( e ){

            if(--this.retry)
                this.content.src = this.content.src;
            else
                this.error(this);

        }

        this.init = function(){
            this.content.onload = this.fn;
            this.content.onerror = P.bind(this.onerror , this);
        }

        this.init();

    }


    function _request(o) {
        this.url = o.url || "";
        this.success = o.success || null;
        this.error = o.error || null;
        this.async = o.async || true;
        this.time = o.timeout || 3000;
        this.type = o.type || "GET";
        this.dataType = o.dataType || "";
        this.data = o.data || "";
        var self = this;
        if (this.url == "") return;

        if (window.XMLHttpRequest) {
            this._request = new XMLHttpRequest();
        } else {
            try {
                this._request = new ActiveXObject("Microsoft.XMLHTTP") || new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                alert("init error...");
                return;
            }
        }

        var timer = setTimeout(function () {
            if (typeof self.error == "function") self.error("timeout");
            if (self._request) {
                self._request.abort();
                self._request = null;
            }
            return true;
        }, this.time);

        this._request.open(this.type, this.url, this.async);
        if (this.type == "POST")
            this._request.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
        this._request.send(this.data);

        this._request.onreadystatechange = function () {
            //console.log(self._request)
            if (self._request.readyState == 4 && self._request.status == 200) {
                var req = self._request;
                var ct = req.getResponseHeader("content-type");
                var res = !dataType && ct && ct.indexOf("xml") >= 0; //check is xml
                var dataType = self.dataType.toUpperCase();
                // if dataType setter is XML OR check is xml ，then output XML
                res = dataType == "XML" || res ? req.responseXML : req.responseText;
                if (dataType == "SCRIPT")  res = eval(req.responseText);
                else if (dataType == "JSON")  res = eval("(" + req.responseText + ");");
                if (self._request.status == 200) {
                    if (timer) clearTimeout(timer);
                    if (typeof self.success == "function") self.success.call(this, res);
                }
            }
        }
    }

    function ajax(o) {
        return new _request(o)
    }

    var jsonp = function (url, callback) {
        var callbackName = 'jsonp_callback_' + new Date().getTime();
        P[callbackName] = function (data) {
            delete P[callbackName];
            document.body.removeChild(script);
            callback(data);
        };
        var script = document.createElement('script');
        script.src = url.replace("=?", "=" + "P." + callbackName);
        document.body.appendChild(script);
    }

    P.jsonp = jsonp;
    P.ajax = ajax;
    return{
        ajax:ajax,
        jsonp:jsonp,
        LoaderQueue:LoaderQueue
    }

})

/**
 * Created by Administrator on 2014/11/6.
 */
P.module("P.base.kinetic",[],function() {
    function kinetic(decay, minVelocity, delay) {

        //加速度a，负值
        this.decay_ = decay || -0.008;
        //速度阈值，px/ms
        this.minVelocity_ = minVelocity || 0.01;
        this.delay_ = delay || 200;
        this.points_ = [];
        this.angle_ = 0;
        this.initialVelocity_ = 0;
    };

    kinetic.prototype = {
        begin : function() {
            this.points_.length = 0;
            this.angle_ = 0;
            this.initialVelocity_ = 0;
        },

        update : function(x, y) {
            this.points_.push(x, y, P.now());
        },

        end : function() {
            if (this.points_.length < 6) {
                // at least 2 points are required (i.e. there must be at least 6 elements
                // in the array)
                //console.log("less than 6")
                return false;
            }
            var delay = P.now() - this.delay_;
            var lastIndex = this.points_.length - 3;
            if (this.points_[lastIndex + 2] < delay) {
                // the last tracked point is too old, which means that the user stopped
                // panning before releasing the map
                return false;
            }

            // get the first point which still falls into the delay time
            var firstIndex = lastIndex - 3;
            while (firstIndex > 0 && this.points_[firstIndex + 2] > delay) {
                firstIndex -= 3;
            }
            var duration = this.points_[lastIndex + 2] - this.points_[firstIndex + 2];
            var dx = this.points_[lastIndex] - this.points_[firstIndex];
            var dy = this.points_[lastIndex + 1] - this.points_[firstIndex + 1];
            this.angle_ = Math.atan2(dy, dx);
            this.initialVelocity_ = Math.sqrt(dx * dx + dy * dy) / duration;
            return this.initialVelocity_ > this.minVelocity_;
        },

        pan : function(from , to) {
            var decay = this.decay_;
            var initialVelocity = this.initialVelocity_;
            var velocity = this.minVelocity_ - initialVelocity;
            var duration = this.getDuration_();

            var easingFunction = (

                function(t) {
                    return initialVelocity * (Math.exp((decay * t) * duration) - 1) /
                        velocity;
                });

            return {
                type : "pan",
                heading : to[0],
                pitch : to[1],
                from : from,
                duration: duration,
                easing: easingFunction,
                start : P.now()
            };
        },


        getDuration_ : function() {
            return Math.log(this.minVelocity_ / this.initialVelocity_) / this.decay_;
        },

        getDistance : function() {
            return (this.minVelocity_ - this.initialVelocity_) / this.decay_;
        },

        getAngle : function() {
            return this.angle_;
        }
    }

    /**
     ** easing
     */
    var easing = {
        inAndOut : function(a){return 3*a*a-2*a*a*a},

        linear : function(t) { return t; },

        upAndDown : function(t) {
            if (t < 0.5) {
                return P.easing.inAndOut(2 * t);
            } else {
                return 1 - P.easing.inAndOut(2 * (t - 0.5));
            }
        }
    };

    return kinetic;
});

/**
 * Created by Administrator on 2014/11/6.
 */
P.module("P.base.utils",["P.base.feature"],function(feature) {
    console.log('load : base.utils')
    var evt = {
        'down' : feature.touch ? 'touchstart' :'click'
    };
    function getLength(v , size) {
        //var slen = 0;
        //for(var i=0,l=len.length; i<l; i++) slen+=len.charCodeAt(i)>128?1:0.5;
        //return (slen+1)*12;
        size || (size = 12);
        return size * v.replace(/[^\x00-\xff]/g, 'ci').length;
    }

    var lastId = 0,
        key = '__panoId__';

    function stamp(obj) {
        return obj[key] = obj[key] || ++lastId;
    }

    var now = Date.now || function () {
        return new Date().getTime();
    }


    //原生bind 事件 的参数顺序是 : 绑定后参数 原始参数
    var bind = function (fn, obj) {
        var args = arguments.length > 2 ? Array.prototype.slice.call(arguments, 2) : [];
        //alert(Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code")!=-1);
        return function () {
            //return Function.prototype.bind && Function.prototype.bind.toString().indexOf("native code")!=-1 ?
            //fn.bind(obj , args):

            return fn.apply(obj, args.concat(Array.prototype.slice.call(arguments)));
        };
    };

    var isarray = Array.isArray || function (obj) {
        return (Object.prototype.toString.call(obj) === '[object Array]');
    };

    var styles = window.getComputedStyle ? window.getComputedStyle(document.documentElement, '') : document.documentElement.style;

    var prefix;
    if (document.body.currentStyle) {
        prefix = {
            dom: "MS", lowercase: "ms", css: "-ms-", js: "Ms"
        }
    }
    var
        pre = (Array.prototype.slice
            .call(styles)
            .join('')
            .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
            )[1],
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
    prefix = {
        dom: dom,
        lowercase: pre,
        css: '-' + pre + '-',
        js: pre[0].toUpperCase() + pre.substr(1)
    };

    var template = function (str, data) {
        return str.replace(/\{ *([\w_]+) *\}/g, function (str, key) {
            var value = data[key];
            if (value === undefined) {
                console.log('No value provided for variable ' + str);
                value = "{" + key + "}";
            } else if (typeof value === 'function') {
                value = value(data);
            }
            return value;
        })
    };

    var logger = function (v) {

        if (__logger) {
            __logger.innerHTML = v + "<br />" + __logger.innerHTML;
            console.log(v);
        }
    }

    var setOptions = function (obj, options) {
        obj.options = P.extend({}, obj.options, options);
        return obj.options;
    }

    var __logger;

    var debug = (function () {
        var d, s;

        function  hide(){
            P.css(d , {
                'top':'50%',
                'width' : '120px',
                'height' : '35px'
            });
            s.mini(true);
        }

        function show(){
            P.css(d , {
                'top':'80%',
                'width' : '100%',
                'height' : '20%'
            });
            s.mini(false);
        }
        function toggle(v){
/*            if(v === undefined)
                d.style.display = (P.css(d, "display") == "none") ? "block" : "none";
            else
                d.style.display = v ? "block" : "none";*/
            //console.log(d.style.height)
            if(v === undefined) v = (d.style.height == '20%') ? false : true;
            console.log(v);
            if(v){
                show();

            }else{
                hide();
            }
/*                d.style.height = (d.style.height == '20%') ? "0%" : "20%";
            else
                d.style.height = v ? "20%" : "0%";*/
        }

        function init(node , pano){
            d =  P.creat("div", "pano-log", null, P.$(node), "display:block;border-radius: 2px;font-family:arial; text-align: left;position:fixed;top:80%;left:0;width:100%;height:20%;background: rgba(0,0,0,.85);color:#fff;border-top:#eee 1px solid;z-index:9999999;padding-top:35px;");
            __logger = P.creat('div',"pano-log",null,d,'padding-left:5px;position:absolute;height:100%;width:100%;overflow-y:auto;margin-top:35px;top:0;z-index:0;');
            P.on(document, 'keydown', function (e) {
                if (e.keyCode == 79) toggle();
                if (e.keyCode == 67) __logger.innerHTML = "";
            }, this);

            s = stat('tl' , pano , d);

            s.el.addEventListener(evt.down , function(){
                toggle();
            })

        }

        return function(node , pano){
            init(node , pano);
        }

    }());


    var tweener = function (el, time, prop) {

        var _propTweens = [];
        var self = this , endTime = (new Date()).getTime() + time;
        for (var key in prop) {
            var value = prop[key];

            var type = typeof(prop[key]);
            if (type != "function") {
                var from = parseFloat(P.Utils.css(el, key));
                if (type == "string") prop[key] = from * parseFloat(prop[key].replace("%", "")) / 100;
                _propTweens.push([this, key, from, prop[key] - from])
            }
        }

        var process = function () {
            var i = _propTweens.length, step = 1 - (endTime - (new Date()).getTime() - 1) / time;
            step = step > 1 ? 1 : ( step < 0 ? 0 : step);

            while (--i > -1) {
                var every = _propTweens[i];
                P.Utils.css(every[0], every[1], every[2] + step * every[3]);
            }
            if (step < 1 && step > 0) setTimeout(function () {
                process()
            }, 20);
            else {
                if (typeof(prop.onComplete) == "function") prop.onComplete.call(self, self);
            }
        }
        if (typeof(prop.onbefore) == "function") prop.onbefore.call(self, self);
        process();

    };


    var proj = {
        EPSG4326To3785 : function(v){
            return {lat : this.latFrom4326ToProj(v.lat) , lng : this.lngFrom4326ToProj(v.lng)}
        },
        EPSG3785To4326 : function(v){
            return {lat : this.latFromProjTo4326(v.lat) , lng : this.lngFromProjTo4326(v.lng)}
        },
        lngFrom4326ToProj : function(c){c=parseFloat(c);return c*111319.49077777778}
        ,
        latFrom4326ToProj : function(c){c=parseFloat(c);c=Math.log(Math.tan((90+c)*0.008726646259971648))/0.017453292519943295;c*=111319.49077777778;return c}
        ,
        lngFromProjTo4326 : function(c){return c/111319.49077777778}
        ,
        latFromProjTo4326 : function(c){c=c/111319.49077777778;return c=Math.atan(Math.exp(c*0.017453292519943295))*114.59155902616465-90}
    }


    var requestFrame = (function () {
        var request =
            window.requestAnimationFrame ||
            window.mozRequestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.msRequestAnimationFrame ||
            function (callback, element) {
                window.setTimeout(callback, 16);
            };

        return function (callback, element) {
            request.apply(window, [callback, element]);
        };
    })();

    var Tweener = {
        looping: false,
        objects: [],
        defaultOptions: {
            time: 1,
            transition: 'easeNone',
            delay: 0,
            prefix: {},
            suffix: {},
            onStart: undefined,
            onStartParams: undefined,
            onUpdate: undefined,
            onUpdateParams: undefined,
            onComplete: undefined,
            onCompleteParams: undefined

        },
        inited: false,
        easingFnLowerCase: {},
        init: function() {
            this.inited = true;
            for (var key in Tweener.easingFn) {
                this.easingFnLowerCase[key.toLowerCase()] = Tweener.easingFn[key];
            }
        },
        toNumber: function(value, prefix, suffix) {
            // for style
            if (!suffix) suffix = 'px';

            return value.toString().match(/[0-9]/) ? Number(value.toString().replace(
                new RegExp(suffix + '$'), ''
            ).replace(
                new RegExp('^' + (prefix ? prefix : '')), ''
            ))
                : 0;
        },
        to: function(obj, options) {
            var self = this;
            if (!this.inited) this.init();
            var o = {};
            o.target = obj;
            o.targetPropeties = {};

            for (var key in this.defaultOptions) {
                if (typeof options[key] != 'undefined') {
                    o[key] = options[key];
                    delete options[key];
                } else {
                    o[key] = this.defaultOptions[key];
                }
            }

            if (typeof o.transition == 'function') {
                o.easing = o.transition;
            } else {
                o.easing = this.easingFnLowerCase[o.transition.toLowerCase()];
            }

            for (var key in options) {
                if (!o.prefix[key]) o.prefix[key] = '';
                if (!o.suffix[key]) o.suffix[key] = '';
                var sB = this.toNumber(obj[key], o.prefix[key],  o.suffix[key]);
                o.targetPropeties[key] = {
                    b: sB,
                    c: options[key] - sB
                };
            }

            setTimeout(function() {
                o.startTime = (new Date() - 0);
                o.endTime = o.time * 1000 + o.startTime;

                if (typeof o.onStart == 'function') {
                    if (o.onStartParams) {
                        o.onStart.apply(o, o.onStartParams);
                    } else {
                        o.onStart();
                    }
                }

                self.objects.push(o);
                if (!self.looping) {
                    self.looping = true;
                    self.eventLoop.call(self);
                }
            }, o.delay * 1000);
        },
        eventLoop: function() {
            var now = (new Date() - 0);
            for (var i = 0; i < this.objects.length; i++) {
                var o = this.objects[i];
                var t = now - o.startTime;
                var d = o.endTime - o.startTime;

                if (t >= d) {
                    for (var property in o.targetPropeties) {
                        var tP = o.targetPropeties[property];
                        try {
                            o.target[property] = o.prefix[property] + (tP.b + tP.c) + o.suffix[property];
                        } catch(e) {}
                    }
                    this.objects.splice(i, 1);

                    if (typeof o.onUpdate == 'function') {
                        if (o.onUpdateParams) {
                            o.onUpdate.apply(o, o.onUpdateParams);
                        } else {
                            o.onUpdate();
                        }
                    }

                    if (typeof o.onComplete == 'function') {
                        if (o.onCompleteParams) {
                            o.onComplete.apply(o, o.onCompleteParams);
                        } else {
                            o.onComplete();
                        }
                    }
                } else {
                    for (var property in o.targetPropeties) {
                        var tP = o.targetPropeties[property];
                        var val = o.easing(t, tP.b, tP.c, d);
                        try {
                            // FIXME:For IE. A Few times IE (style.width||style.height) = value is throw error...
                            o.target[property] = o.prefix[property] + val + o.suffix[property];
                        } catch(e) {}
                    }

                    if (typeof o.onUpdate == 'function') {
                        if (o.onUpdateParams) {
                            o.onUpdate.apply(o, o.onUpdateParams);
                        } else {
                            o.onUpdate();
                        }
                    }
                }
            }

            if (this.objects.length > 0) {
                var self = this;
                P.requestAnimationFrame(function() { self.eventLoop() });

            } else {
                this.looping = false;
            }
        }
    };

    Tweener.easingFn = {
        easeNone: function (t, b, c, d) {
            return c * t / d + b;
        }
    }

    Tweener.easingFn.linear = Tweener.easingFn.easeNone;

    var stat = (function () {
        var startTime , tickTime , cTime, instance;
        var _fps = 0 , //fps
            _avg3 , //3项平均
            _avg5, //5项平均
            _min = 9999, //最小
            _max = 0, //最大
            _avg = 0, //平均
            __fps_counter = 0,//统计次数
            md = 0,//平均标偏差(mean deviation)
            mds = 0;//平均差累计

        var fl = Math.floor, abs = Math.abs;
        var ready = false;
        var el;
        var info;

        var mode = 'full';

        var process = function(){
            var newTime = new Date().getTime();
            __fps_counter++;
            _fps = fl( 1000 / (newTime - startTime));
            //剔除异常帧
            if(_fps>70) {
                startTime = newTime;
                requestFrame(process);
                return;
            }
            _avg = fl(__fps_counter * 1000 / (newTime - tickTime));
            if (_min > _fps) _min = _fps;
            if (_max < _fps) _max = _fps;
            //if(_max>100) console.log(newTime - startTime)
            mds += abs(_fps - _avg);
            md = fl(100 * mds / __fps_counter)/100;


            //el.innerHTML = info + p._scene._totalTiles+" Tile(s)<br/>"+ "FPS : " + _fps + "<br />" + "min/avg/max" + "<br />" + _min + "," + _avg + "," + _max+"<br />"+ p.getDeep();

            if (newTime - cTime >= 1000) {

                el.innerHTML = (mode == 'full') ?
                    (info + ', '+instance._scene._totalTiles+" tile(s)<br/>"+ "FPS: " + _fps + "(" + "min/avg/max/md = " + _min + "/" + _avg + "/" + _max+"/"+md+") , "+ instance.getDeep()) :
                        (info + ', '+instance._scene._totalTiles+" tile(s)<br/>"+ "FPS: " + _fps)
                cTime = newTime;
            }
            startTime = newTime;
            requestFrame(process);
        }
        var tick = function (pos , ins , parent) {
            instance = ins;
            ready = true;
            pos = pos || "lc";
            var s = {"l":"left:0;","r":"right:0;","t":"top:0;","b":"bottom:0;",'c':'top:42%;'},style = "";
            for(var i=pos.length;i--;)
            {
                if(s[pos[i]]) style += s[pos[i]];
            }
            el = document.createElement("div");
            el.setAttribute("style", style+"position:absolute;height:32px;color:#0f0;z-index:2;text-align: left;padding-left:2px;transform: translateZ(999999px);letter-spacing:1px;font-size:12px !important;");

            info = ins.options.render.toUpperCase() +"Render ( build:"+P.version+" ) ";

            parent || (parent = document.body);
            parent.appendChild(el);
            startTime = tickTime =  cTime =new Date().getTime() ;
            requestFrame(process);

        }

        var mini = function(v){
            mode = v ? 'mini' : 'full';
        }
        return function(pos , ins, parent){
            tick(pos , ins, parent);
            return {
                el : el,
                mini : mini
            }
        };

        //tick();
    }());

    P.stamp = stamp;
    P.prefix = prefix;
    P.setOptions = setOptions;

    P.bind = bind;
    P.now = now;
    P.requestAnimationFrame = requestFrame;

    return {
        getLength : getLength,
        stamp : stamp,
        now : now,
        bind : bind,
        promise: null,
        isArray :isarray,
        prefix:prefix,
        template:template,
        setOptions:setOptions,
        logger:logger,
        tweener:Tweener,
        requestFrame:requestFrame,
        proj:proj,
        debug : debug
    }
})

/**
 * Created by Administrator on 2014/11/7.
 */
P.module("P.base.services",["P.base.utils"],function(utils){

    var dataConvert = function(d){
        var scene = [];
        d = d.detail.scenes;
        for(var i=0;i< d.length;i++){
            scene[i] = {
                "id" : d[i].svid,
                "title" : d[i].name,
                "link":[],
                "pois":[],
                "lat":utils.proj.latFromProjTo4326(d[i].y),
                "lng":utils.proj.lngFromProjTo4326(d[i].x),
                "dir":d[i].dir
            }
        }

        //console.log(scene)

        return scene;
        /* return {"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene};*/

        /* {"dir":53,"name":"正门","pitch":0,"svid":"100930Y7140123100324950","x":13378176.470000,"y":3531281.830000,"zoom":1}*/
        /*    {"id": "414031730217098120174100000", "title": "正门", "link": [], "pois": [
         {"type": "bank", position: "30,90", "title": "兴趣点1"}
         ]}*/

    }

    var getQQScene = function(scenic_id , cb){
        utils.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d){
            cb( dataConvert(d) );
        });
    }

    var getQQData = function(v , cb){
        P.jsonp("http://sv.map.qq.com/sv?pf=html5&svid="+v+"&ch=&output=jsonp&cb=?" , function(d){
            var owner = "Tencent SteetView",
                description = d.detail.basic.scenic_name,
                basic =  {"tileSize": 256, "level": 1, "type": "cube",onceMode:true, ignoneLv0:true},
                scene = [];
            var provider = {"id":"Tencent",link:"http://map.qq.com",title:description};
            var md = d.detail.building.floors;
            var sid = d.detail.building.group_id;
            for(var i=0;i<md.length;i++)
            {
                scene[i] = {"id":sid+"-"+(i+1),"title":md[i].name,"pano":[] , "sync":false}
            }

            var start = 0;
            function loadSceneData(){
                var scenic_id = sid+"-"+(start+1);
                P.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d2){
                    scene[start].pano = dataConvert(d2);
                    start++;
                    if(start < scene.length) setTimeout(loadSceneData,10);
                    else  cb({"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene});
                });
            }


            loadSceneData();

            //cb({"owner":owner, "provider":provider,"description":description,"basic":basic,"scene":scene});
            /*var scenic_id = d.detail.basic.scenic_id;
             P.jsonp("http://sv.map.qq.com/photos?id="+scenic_id+"&output=jsonp&cb=?" , function(d1){
             cb( P.Utils.dataConvert(d1 , d) );
             });
             */
        })
    }

    var getQQ
    var QQ2HQT = function(id , cb){
        P.jsonp("http://sv0.map.qq.com/sv?pf=html5&svid="+id+"&ch=&output=jsonp&cb=?&token="+new Date().getTime(),function(d){
            var dir = parseInt(d.detail.basic.dir);
            var lat= d.detail.addr.y_lat , lng = d.detail.addr.x_lng;
            var time = "20"+id.substring(8,10)+"-"+id.substring(10,12) + "-01";
            console.log({time:time,lat:lat,lng:lng,alt:0,dir:dir});
            console.log(utils.code.encode({time:time,lat:lat,lng:lng,alt:0,dir:dir} , true));
        })
    }

    var geoCoder = function(v , cb , key){
        // 通用uri,有IP限制
        var url = "http://sv.map.qq.com/rarp?lat="+ v.lat+"&lng="+ v.lng+"&output=jsonp&cb=?";

        //标准接口 参考 QQ Map API
        if(key) url = "http://apis.map.qq.com/ws/geocoder/v1/?output=jsonp&location="+ v.lat+","+v.lng+"&key="+key+"&get_poi=0&cb=?";


        P.jsonp(url , function(d) {
            var ars = "";
            if (key == undefined) {
                if (d.info.errno == 0) {
                    ars = d.detail.AD;
                }
            }else
            {
                if(d.status == 0)
                {
                    ars = d.result.address;
                }
            }
            cb(ars);

        });
    }

    var getCommentFromQQ = function(id , cb){
        P.jsonp("http://routes.map.qq.com/?qt=rich&pid="+id+"&output=jsonp&cb=?",function(data){
            var reviews = [];
            var comment = data.detail.comments.comment_info;

            for(var i=0;i<comment.length;i++)
            {
                var d = comment[i];
                reviews[i] = {
                    review_id: (d.comment_detail_url.match(/review\/(\d+)/) || [0, -1])[1],
                    user_nickname: d.comment_user,
                    created_time: d.comment_time,
                    text_excerpt: d.comment_content,
                    rating_img_url: "http://i3.dpfile.com/s/i/app/api/32_0star.png",
                    rating_s_img_url: "http://i2.dpfile.com/s/i/app/api/16_0star.png",
                    "product_rating": 3,
                    "decoration_rating": 4,
                    "service_rating": 3,
                    "review_url": d.comment_detail_url
                };

            }
            var all = {
                "status": "OK",
                "count":data.detail.comments.comment_num,
                "reviews":reviews,
                "additional_info" : {
                    "more_reviews_url": data.detail.comments.rich_source_url
                }
            }

            cb && cb(all);

        })

    }

    return {
        getQQScene:getQQScene,
        getQQData:getQQData,
        QQ2HQT:QQ2HQT,
        geoCoder:geoCoder,
        getCommentFromQQ:getCommentFromQQ
    }

});
/**
 * Created by Administrator on 2014/11/6.
 */

    //快速ua
P.module("P.base.ua",[],function(){
    var pf = navigator.platform.toLowerCase() , ua = navigator.userAgent.toLowerCase();
    //var pf = /(Win|Mac)/.test(pf) ? "Desktop" :
    // (typeof orientation !== undefined + '') ? "Mobile" : "";
    var os = /win/.test(pf) ? "windows" :
        /mac/.test(pf) ? "mac" :
            /ios/.test(pf) ? "ios" :
                (/android/.test(ua) && /linux/.test(pf)) ? "android" :
                    /linux/.test(pf) ? "linux" :"";

    var shell = /chrome/.test(ua) ? "chrome" :
            /webKit/.test(ua) && !/chrome/.test(ua) ? "safari" :
        /opera/.test(ua) ? "opera" :
                /msie/.test(ua) && !/opera/.test(ua) ? "ie" :
                /firefox/.test(ua) && !/(compatible|webkit)/.test(ua) ? "firefox" : "unknow";

    var version = (ua.match(/.+(?:rv|me|it|ra|ie)[\/: ](\d+\.?\d*)/) || [0, '0'])[1];

    return {
        "shell":shell,
        "version":version,
        "os":os,
        "pf":pf
    }
})

;(function(){
	var gl = null;
	var webgl = window.webgl = {
		init : function(canvas , cfg){
            cfg = cfg || {};

			var g = canvas.getContext("webgl",cfg)
			|| canvas.getContext("experimental-webgl",cfg)
			|| canvas.getContext("webkit-3d",cfg)
			|| canvas.getContext("moz-webgl",cfg);
            g.clearColor(0.0, 0.0, 0.0, 0.0);
			//document.body.appendChild(canvas);
			//alert(g)
			//alert(canvas.getContext("webgl"));
			this.activate(g);
			gl.vs = gl.createShader(gl.VERTEX_SHADER);
			gl.fs = gl.createShader(gl.FRAGMENT_SHADER);
			gl.program = gl.createProgram();
			gl.__varObj = {};
			return g;
		},

		//激活当前 webgl环境
		activate : function(g)
		{
			webgl.gl = gl = g; return this;
		},

		elementBuffer : function(d){
			return new Buffer("ELEMENT_ARRAY_BUFFER" , d);
		},

		arrayBuffer : function(d){
			return new Buffer("ARRAY_BUFFER" , d);
		},

		texture2d : function(a,b,c,d){
			return new Texture2D(a , b, c, d);
		},

		creat:function(vs , fs){
			gl.shaderSource(gl.vs, vs);
			gl.shaderSource(gl.fs, fs);

			gl.compileShader(gl.vs);
			gl.compileShader(gl.fs);
			gl._source = [vs,fs];
			return this;
		},

		use : function(){

			gl.attachShader(gl.program, gl.vs);
			gl.attachShader(gl.program, gl.fs);

			gl.linkProgram(gl.program);
			this._an(gl._source[0] + gl._source[1])
			gl.useProgram(gl.program);
			return this;
		},

		_an : function(source){

			source.replace(/\b(attribute|uniform)\b[^;]+?(\w+)\s+(\w+)\s*;/g , function($0,$1,$2,$3){
				var loc, type, size=$2.match(/\d+$|$/g,"")[0]|0||1 , handler , t = 1 , ismat;
				if($1=="attribute"){
					loc = gl.getAttribLocation(gl.program,$3);

					if(loc<0) return;
					gl.enableVertexAttribArray(loc);

					t = 0;

				}else{
					loc = gl.getUniformLocation(gl.program,$3);
					if(!loc) return;
					type=/int|sampler/.test($2)?"i":"f";
                    ismat = /^mat/.test($2);
                    //if(type == "i") alert($2)
				};
				gl.__varObj[$3] = {
					size : size ,
					loc : loc,
					type : t,
					data : null,
					ismat : ismat,
					field : ismat ? "uniformMatrix"+size+"fv" : "uniform"+size+type+"v"
				}
			})
		},

		set : function(o , v){
			if(arguments.length == 1)
			{
				if(typeof(o) == "object")
				{
					for(var i in o)
						this.set(i , o[i]);
				}else if(typeof(o) == "string")
				{
					return gl.__varObj[o].data;
				}
			}else if(arguments.length == 2)
			{
				if(gl.__varObj[o])
				{
					//保存数据
					gl.__varObj[o].data = v;

					var t = gl.__varObj[o];

					// attr
					if(t.type == 0)
					{
						//缓冲托管
						if(Object.prototype.toString.call(v) === '[object Array]' || Object.prototype.toString.call(v) === '[object Float32Array]')
						{
							v = webgl[gl.__varObj[o].type==0 ? "arrayBuffer" : "elementBuffer"](v);
							gl.__varObj[o].buff = v;
						}else{
							v.bind();
						}

						gl.vertexAttribPointer(gl.__varObj[o].loc,gl.__varObj[o].size,gl.FLOAT,false,0,0)
					}else
					{
						//
                        //console.log(t.loc)
						if(t.ismat) gl[t.field](t.loc,false,new Float32Array(v));
						else gl[t.field](t.loc, v instanceof Array?v:[v]);
					}


				}

			}

			return this;
		},

		get : function(o){
			return gl.__varObj[o] ?
				gl.__varObj[o] : null;
		},

        //清除绘制出的指定数据
        clear : function(){
            var n,v=0;
            for(var i=arguments.length;n=arguments[--i];) v |= gl[n+"_BUFFER_BIT"];
            v && gl.clear(v);
            return this;
        },

        color : function(v){
            if(Object.prototype.toString.call(v) !== '[object Array]')
            {
                v = Array.prototype.slice.call(arguments)
            }

            gl.clearColor.apply(gl , v);
            return this;
        },

		draw : function(obj , type){
			if(typeof(obj) == "number"){
				//gl.drawElements( gl.TRIANGLES, obj, gl.UNSIGNED_SHORT,0);
				//return this;
			}
			type = gl[type || "TRIANGLES"];

			if(obj._buffer){
				//console.log("draws")
				gl.drawElements( type, obj.bind().data().length, gl.UNSIGNED_SHORT,0)
			}else
			{
				//图元，顶点数组开始下标，顶点数量
				gl.drawArrays(type,0,obj);
			}
			return this;
		},
		
		drawElements : function(type , l){
			
			gl.drawElements(gl[type], l, gl.UNSIGNED_SHORT, 0);
			return this;
		},

        viewport : function(w , h){
            gl.viewport(0, 0, w, h);
        },

        setting : function(o){
            var fn = {DEPTH_TEST:"depthFunc",BLEND:"blendFunc",CULL_FACE:null};
            for(var i in o)
            {
                if(o[i] === null) gl.disable(gl[i]);
                else {
                    gl.enable(gl[i]);
                    //一堆 static...
                    fn[i] && gl[ fn[i] ]( gl[o[i]] );
                }

            }
            return this;
        },

		isBuffer:function(v){
			return v instanceof Buffer;
		},
		
		bindTexture : function(v){
            //P.logger("==>"+typeof(tex))
			v.bind();
            return this;
			//gl.bindTexture(gl.TEXTURE_2D, program.currentNodes[i].texture);
		},
		
		unbindTexture:function(v){
			v.isbind() && gl.bindTexture(gl.TEXTURE_2D,null);
			return this;
		}

	};
	
	function Buffer( type , data){
		this.type = type || "ARRAY_BUFFER";
		this._buffer = gl.createBuffer();
		return data ? this.data(data) : this;
	}
	
	Buffer.prototype = {
		
		bind : function(){
			gl.bindBuffer(gl[this.type],this._buffer);
			return this;
		},
		
		isbind : function(){
			return gl.getParameter(gl[type+"_BINDING"]) == this._buff;
		},
		
		unbind : function(){
			this.isbind() && gl.bindBuffer(gl[this.type],null);
			return this;
		},
		
		data : function(v){
			if(v === undefined) return this._data;
			this.bind();
			this._data = v;
			this._rawdata = new (this.type=="ARRAY_BUFFER"?Float32Array:Uint16Array)(v);
			gl.bufferData( gl[this.type], this._rawdata ,gl.STATIC_DRAW );
			return this;
		},
		
		dispose : function(){ gl.deleteBuffer(this._buff); this._buff = null; return this; }
	};
	
	function Texture2D( data,color,w,h )
	{
		this._data = gl.createTexture();
		this._index = 1;
		if(arguments.length)
			this.data.apply(this, Array.prototype.slice.call(arguments) )
			.setting({
				TEXTURE_MIN_FILTER:"LINEAR"
				,TEXTURE_MAG_FILTER:"LINEAR"
				,TEXTURE_WRAP_S:"CLAMP_TO_EDGE"
				,TEXTURE_WRAP_T:"CLAMP_TO_EDGE"
			});
        return this;
	}
	
	Texture2D.prototype = {
		//绑定tex 序号，最大20个
		bind:function(i){
            if(i == undefined) this._index = i;

			//gl.activeTexture(gl["TEXTURE" + this._index]);
			gl.bindTexture(gl.TEXTURE_2D,this._data);
			return this;
		},
		  
		unbind:function(){
			this.isbind() && gl.bindTexture(gl.TEXTURE_2D,null);
			return this;
		},
		  
		isbind:function(){
           // P.logger(this._index+"<===")
			//gl.activeTexture(this._index);
			return this._index == gl.getParameter(gl.TEXTURE_BINDING_2D);
		},
		  
		data : function(obj,color,width,height){
			this.bind(this._index); color = gl[color];
            //this.obj = obj
            var argus = obj instanceof HTMLElement ?
                    [gl.TEXTURE_2D,0,color,color,gl.UNSIGNED_BYTE,obj] :
                    [gl.TEXTURE_2D,0,color,width,height,0,color,gl.UNSIGNED_BYTE,obj ? new Uint8Array(obj):null];
			gl.texImage2D.apply( gl , argus);
			return this;
		},


		setting : function(o , v){
			this.bind(this._index);
			if(arguments.length == 2) gl.texParameteri(gl.TEXTURE_2D,gl[o],gl[v]);
			else{
				for(var i in o)
					gl.texParameteri(gl.TEXTURE_2D,gl[i],gl[o[i]]);
			}
			return this;
		},
		
		//获取pixel 值，返回 unit8array
		read : function(x, y, w, h){
			var w = w || 1,h = h || 1,
				r = new Uint8Array(w*h*4);
			this.bind(this._index);
			gl.readPixels(x,y,w,h,gl.RGBA,gl.UNSIGNED_BYTE,r)
			return r;
		},

        //生成Mipmap方式的贴图
		generate:function(){
			this.bind(this._index);
			gl.generateMipmap(gl.TEXTURE_2D);
			return this;
		},
		
		dispose : function(){
			gl.deleteTexture(this._data);
			return this;
		}
	}
}());
/**
 * 控制基类
 */
P.module('P.control.Control',[],function(){
    function control(opts){
        P.setOptions(this, opts);
    }

    control.prototype = {
        _container : null,

        options: {
            position: "topleft"
        },


        getPosition: function () {
            return this.options.position;
        },

        setPosition: function (position) {

            this.options.position = position;

            return this;
        },

        getContainer: function () {
            return this._container;
        },

        addTo : function(pano){
            if(pano === null)
            {
                this._pano._control.removeChild(this._container);
                this._pano = null;
            }else {
                this._pano = pano;
                this._pano._control.appendChild(this._container);
                P.css(this._container,{"z-index":2000+this._pano._controlStamp++});
                this.onAdd();
            }
        },

        onAdd : function(){},

        removeFrom: function (pano) {
            var pos = this.getPosition(),
                corner = pano._controlCorners[pos];

            corner.removeChild(this._container);
            this._pano = null;

            if (this.onRemove)
                this.onRemove(pano);

            return this;
        },

        _refocusOnMap: function () {
            if (this._pano) {
                this._pano.getContainer().focus();
            }
        }
    }

    return control;
})
/**
 * 控制基类
 */
P.module('P.control.Loading',['P.control.Control'],function(Control){
    function Loading(opts){
        P.setOptions(this, opts);
        this._container = P.creat('div',null ,'pano-loading',null,'height:3px;background:#67CF22;top:0;left:0;width:0%;transition:all 0.5s;-webkit-transition:all 1s;');
    }
    P.inherit(Loading , Control , {
        onAdd : function(){
            this._pano.addEventListener('load_tiles' ,this.onProcess ,this);
        }
        ,
        onProcess : function(evt){
            var p = (100 * evt.loaded / evt.total) + '%';
            this._container.style.width = p;

            if(evt.loaded == evt.total) this.hide();
            else{
                this.show();
            }
        }
        ,
        show : function(){
            this._container.style.opacity = '1';
        }
        ,
        hide : function(){
            this._container.style.opacity = '0';

        }
    })
    return Loading;
})
P.module("P.core.math.Math",[],function(){
    return {
        RADTODEG: 180 / Math.PI,
        DEGTORAD: Math.PI / 180
    }
});
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

/*
 ** 	P.Interaction
 ** 	基础类 交互操作的处理脚本
 */
P.module('P.interaction.Interaction',[],function(){
    function interaction(pano){
        if (pano) this.addTo(pano);
    }

    interaction.prototype = {
        addTo: function (pano) {
            this.onAdd(pano).enable();
            return this;
        },

        onAdd: function (pano) {
            this._pano = pano;
            return this;
        },

        enable: function () {
            if (this._enabled) {
                return;
            }
            this._enabled = true;

            this.activate();
        },

        disable: function () {
            if (!this._enabled) {
                return;
            }
            this.deactivate();
            this._enabled = false;
        },

        enabled: function () {
            return !!this._enabled;
        },

        activate : function(){},

        deactivate : function(){},

        CLASS_NAME: "P.Interaction"
    }

    return interaction;
});
/**
 * Drag 的基本事件将在初始化后全部绑定,可以绑定除Pano主体外的其他DOM对象
 */

P.module('P.interaction.DragObject',['P.interaction.Interaction','P.base.events','P.base.feature','P.base.dom','P.core.geom.Point'],function(interaction,events,feature,dom,Point){

    var __static__ = {
        START: feature.touch ? ['touchstart', 'mousedown'] : ['touchstart','mousedown'],
        END: {
            mousedown: 'mouseup',
            touchstart: 'touchend',
            pointerdown: 'touchend',
            MSPointerDown: 'touchend',
            mouseup:'mouseup',
            touchend:'touchend'
        },
        MOVE: {
            mousedown: 'mousemove',
            touchstart: 'touchmove',
            pointerdown: 'touchmove',
            MSPointerDown: 'touchmove',
            mouseup:'mousemove',
            touchend:'touchmove'
        }
    }

    function DragObject(el, dragTarget){
        this._el = el;
        this._dragTarget = dragTarget || el;
    }


    DragObject.prototype = {

        ClassName: "P.interaction.DragObject",

        _moved: false, _onactive: false,


        activate: function () {
            //防止多次绑定
            if (this._enabled) {
                return;
            }
            var evts = __static__.START;
            for (var i = evts.length; i--;) {
                P.on(this._el, evts[i], this._onDown, this);
            }

            this._enabled = true;
        },
        deactivate: function () {
            if (!this._enabled) {
                return;
            }
            var evts = __static__.START;
            for (var i = evts.length; i--;) {
                P.un(this._el, evts[i], this._onDown, this);
            }

            this._enabled = false;
            this._moved = false;
        },
        _onDown: function (e) {
            //if(e.touches) document.title = "touch on "+ e.touches.length +  " points";
            if (((e.which !== 1) && (e.button !== 1) && !e.touches) || (e.touches && e.touches.length > 1)) {
                this._onactive = false;
                return;
            }

            dom.event.stopPropagation(e);

            // touch mouse 通用
            var point = e.touches ? e.touches[0] : e;

            this._startPoint = new Point(point.clientX, point.clientY);

            this._startPos = this._newPos = dom.getPosition(this._el);

            this._onactive = true;
            //绑定移动 和 释放 事件
            //alert(P.proto.DragObject.MOVE[e.type])
            P.on(document, __static__.MOVE[e.type], this._onMove, this)
                .on(document, __static__.END[e.type], this._onUp, this);
            //document.title = "on";
        },
        _onMove: function (e) {

            //禁止多点事件,
            if (e.touches && e.touches.length > 1) {
                this._onactive = false;
                return;
            }

            if (this._onactive == false) return;

            var point = (e.touches && e.touches.length === 1 ? e.touches[0] : e),
                nPoint = new Point(point.clientX, point.clientY),
                offset = nPoint.subtract(this._startPoint);


            if (!offset.x && !offset.y) {
                return;
            }
            //微小移动不触发
            if (feature.touch && (Math.abs(offset.x) + Math.abs(offset.y)) < 2) {
                //document.title = offset.x+","+offset.y;
                return;
            }

            dom.event.preventDefault(e);

            if (this._moved == false) {

                this._dragTarget.trigger('dragstart', {
                    pixel: this._newPoint,
                    offset: offset,
                    distance: this._newPos.distanceTo(this._startPos)
                });

                this._moved = true;
                this._startPos = dom.getPosition(this._element).subtract(offset);
                this._startPoint = nPoint;
                dom.addClass(this._el, 'pano-dragging');
                this._lastTarget = e.target || e.srcElement;
                //dom.addClass(this._lastTarget, 'pano-drag-target');

            }

            this._newPos = this._startPos.add(offset);
            this._newPoint = nPoint;

            this._dragTarget.trigger('dragging', {
                pixel: this._newPoint,
                offset: offset,
                distance: this._newPos.distanceTo(this._startPos)
            });
            // document.title = "move";

        },
        _onUp: function (e) {
            //if(this._moved == false) return;


            //try{
            dom.removeClass(this._el, 'pano-dragging');

            if (this._lastTarget) {
                dom.removeClass(this._lastTarget, 'pano-drag-target');
                this._lastTarget = null;
            }

            /*P.un(document, e.type, this._onMove)
             .un(document, e.type, this._onUp);*/
            //alert(e.type)
            /* for (var i in P.proto.DragObject.MOVE) {
             P.un(document, P.proto.DragObject.MOVE[i], this._onMove)
             .un(document, P.proto.DragObject.END[i], this._onUp);
             }*/
            P.un(document, __static__.MOVE[e.type], this._onMove)
                .un(document, __static__.END[e.type], this._onUp);
            if (this._moved && this._onactive) {
                this._dragTarget.trigger('dragend', {
                    pixel: this._newPoint,
                    distance: this._newPos.distanceTo(this._startPos)
                });
                // document.title = "drag end";

            }
            // }catch(e){ alert("up error")}

            //document.title = "dragging up";
            // document.title = "up";

            this._moved = false;
            this._onactive = false;

        }
    }

    //mixin 事件
    P.extend(DragObject.prototype , events);

    return DragObject;
});
P.module('P.interaction.Drag',[
    'P.interaction.Interaction',
    'P.base.events',
    'P.interaction.DragObject',
    'P.base.kinetic'
],function(interaction,events,DragObject,Kinetic){
    function Drag(pano){
        interaction.call(this,pano);

    }


    P.inherit(Drag , interaction ,{

        CLASS_NAME: "P.interaction.Drag",

        mixin: events,

        controlMode : 1,

        activate: function () {
            this._dragObj = new DragObject(this._pano._dragMask, this);
            //console.log(this._dragObj)
            this.kinetic = new Kinetic();
            this._pano.kinetic = this.kinetic;

            this._dragObj.on({
                'dragstart': this._onDragStart,
                'dragging': this._onDragging,
                'dragend': this._onDragEnd
            }, this).activate();
        },

        _onDragStart_1 : function(){
            this._pano.animation.clear();

            this._pano._scene._loaderQueue.clear();

            this._pano.kinetic.begin();


        },

        _onDragStart: function() {
            //document.title = "dragstart";
            this.controlMode = this._pano.options.controlMode;

            this._pano.animation.clear();

            this._pano._scene._loaderQueue.clear();

            //this._pano.frameSnapshot();
            this._pano.kinetic.begin();
            //console.log(this._pano.timeline.fn)

            var pov = this._pano.getPov();
            this._ori = {x: pov.heading, y: pov.pitch };

            this._ori_pov = this._pano._camera.unproject( this._dragObj._startPoint ).toSpherical(true);
            this.lastp = this._dragObj._startPoint;
            //极点在视野内
            this.pole_s = this._pano._camera._projectSphere({x: pov.heading, y: 89.99});
            this.pole_n = this._pano._camera._projectSphere({x: pov.heading, y: -89.99});

            //如果startpoint 在 极圈内，跟随
            //this.follow = this._ori_pov.pitch > 80;
            this._opposite = (this.pole_s != undefined )
            || (this.pole_n != undefined );

            //P.logger("event : dragstart( on pano )");

            this.kinetic.begin({x: pov.heading, y: pov.pitch});
            this._lastnpov = this._ori_pov.x;
        },
        deactivate: function () {
            this._draggable.deactivate();
        },

        _lastnpov:0,
        _onDragging: function () {

            var dx,dy;
            if(this.controlMode == 1)
            {
                //console.log()
                var p = this._dragObj._newPoint.subtract(this.lastp);
                //console.log(p)
                var dpov = this._pano._camera.getPovFor2D(p);

                //dpov.pitch -= this._ori.y;
                //dpov.heading -= this._ori.x;
                this.lastp = this._dragObj._newPoint;
                //console.log(dpov)
                this._pano.setPov(dpov , true);
            }else if(this.controlMode == 2)
            {
                var pov = this._pano.getPov();
                //标准值 [0,360]
                var n_pov = this._pano._camera.unproject( this._dragObj._newPoint  ).toSpherical(true);

                this._lastnpov = n_pov.x;
                dy = this._ori_pov.y - n_pov.y;
                dx = this._ori_pov.x - n_pov.x;
                if(Math.abs(dx)>270){
                    if(dx > 0) dx -= 360;
                    else dx+= 360;
                }

                //更改 可见极点时的操作方式
                if((this.pole_s && this.pole_s.y < this._dragObj._startPoint.y) || (this.pole_n && this.pole_n.y > this._dragObj._startPoint.y)){
                    //var f = this._pano._camera._focus;
                    dy = -(this._dragObj._newPoint.y - this.lastp.y)*this._pano._camera._bfov/this._pano.viewHeight;
                    dx = -(this._dragObj._newPoint.x - this.lastp.x)*this._pano._camera._bfov/this._pano.viewWidth;

                    this.lastp = this._dragObj._newPoint;
                }

                if(isNaN(dx) == false && isNaN(dy) == false)
                {
                    var pov = {heading: dx  , pitch: dy};
                    //console.log(this._ori_pov.x +","+ n_pov.x +","+dx)
                    //不要updateTiles
                    this._pano.setPov(pov, true , false);
                    //P.Tweener
                }

                //this._pano._panTo(this._ori_pov , this._dragObj._newPoint)

            }else if(this.controlMode == 0){

            }

            var p = this._pano.getPov();

            this._pano.trigger('move').trigger('pov_changed', p);

            this.kinetic.update( p.heading , p.pitch );


        },
        _onDragEnd: function (e) {
            var pov = this._pano.getPov();
            //alert("dragend")
            //状态快照
            //this._pano.frameSnapshot();
            var m = this.kinetic.end();

            if (m) {
                //传入mouseup 的位置,作为pan动作的起始位置, 最近一次的位移作为 初始位移，由于 pan 衰减的 easing 函数,返回值不在 [0,1],因而 缓动 停止时的 位置 有可能远于 mousedown 时的位置
                var distance = this.kinetic.getDistance(),
                    angle = this.kinetic.getAngle(),
                    dx = distance * Math.cos(angle),
                    dy = distance * Math.sin(angle);
                // distace < 0
                if(this.animate)
                    this._pano.animation.remove(this.animate);

                this.animate =  this._pano.animation.add( this.kinetic.pan([pov.heading,pov.pitch] , [pov.heading + dx, pov.pitch + dy] ) );

            }else
            {
                this._pano.trigger('move').trigger('pov_changed', pov);
                this._pano.render(true);
            }

        }
    })

    return Drag;
});
P.module('P.interaction.Keyboard',['P.interaction.Interaction','P.base.events','P.base.dom'],function(interaction,events,dom){
    function Keyboard(opts){
        opts = opts || {};
        this._pano = pano;
        this._panOffset = opts.keyboardPanOffset || 1;
        this._zoomOffset = opts.keyboardZoomOffset || 0.1;
        this._setOffset();

    }

    var KEYCODES = {
        LEFT: [37],
        RIGHT: [39],
        DOWN: [40],
        UP: [38],
        ZOOMIN: [107],
        ZOOMOUT: [109]
    }

    P.inherit(Keyboard , interaction , {
        static: {
            KEYCODES: {
                LEFT: [37],
                RIGHT: [39],
                DOWN: [40],
                UP: [38],
                ZOOMIN: [107],
                ZOOMOUT: [109]
            }
        },
        _panOffset: 5, _zoomOffset: 0.05,

        activate: function () {
            dom.on(document, 'keydown', this._onKeyDown, this);
        },
        deactivate: function () {
            dom.un(document, 'keydown', this._onKeyDown, this);
        },
        _setOffset: function () {

            var act_pan = {} , act_zoom = {} , codes = KEYCODES , i;
            var panOffset = this._panOffset , zoomOffset = this._zoomOffset;

            for (i = codes.LEFT.length; i--;) {
                act_pan[codes.LEFT[i]] = {heading: 0 - panOffset, pitch: 0};
            }
            for (i = codes.RIGHT.length; i--;) {
                act_pan[codes.RIGHT[i]] = {heading: panOffset, pitch: 0};
            }
            for (i = codes.UP.length; i--;) {
                act_pan[codes.UP[i]] = {heading: 0, pitch: 0 - panOffset};
            }
            for (i = codes.DOWN.length; i--;) {
                act_pan[codes.DOWN[i]] = {heading: 0, pitch: panOffset};
            }

            for (i = codes.ZOOMIN.length; i--;) {
                act_zoom[codes.ZOOMIN[i]] = zoomOffset;
            }
            for (i = codes.ZOOMOUT.length; i--;) {
                act_zoom[codes.ZOOMOUT[i]] = 0 - zoomOffset;
            }

            this.act_pan = act_pan;
            this.act_zoom = act_zoom;
        },
        _onKeyDown: function (e) {
            var key = e.keyCode,
                pano = this._pano;
            //P.logger(key);
            if (key in this.act_pan) pano.setPov(this.act_pan[key], true);

            if (key in this.act_zoom) pano.setZoom(this.act_zoom[key], true);

            //dom.event.stop(e);
        }
    });

    return Keyboard;
})
P.module('P.interaction.PinchZoom',['P.interaction.Interaction','P.base.events','P.base.dom','P.core.geom.Point'],function(interaction,events,dom,Point){
    function PinchZoom(pano){
        interaction.call(this,pano);
    }

    P.inherit(PinchZoom, interaction , {
        CLASS_NAME: "P.interaction.PinchZoom",
        _onactive:false,_zoomed:false,
        activate: function () {

            P.on(this._pano._dragMask, "touchstart", this._onTouchStart, this);

        },

        deactivate: function () {
            P.un(this._pano._dragMask, "touchstart", this._onTouchStart);
        },

        _onTouchStart: function (e) {

            var pano = this._pano;
            //if(e.touches.length > 1) alert(e.touches.length)
            //P.logger("touches : " + e.touches.length + ", result : " + (!e.touches || e.touches.length !== 2));
            if (e.touches && e.touches.length <2) {
                this._onactive = false;
                return;
            }

            this._onactive = true;
            var p1 = new Point(e.touches[0].clientX, e.touches[0].clientY),
                p2 = new Point(e.touches[1].clientX, e.touches[1].clientY);
            //viewCenter = _pano.getCenter();

            this._startCenter = p1.interpolate(p2, 0.5);
            //this._povCenter = this._pano._camera._unprojectSphere( this._startCenter );

            this._lookat = this._startCenter;

            this._tick = Math.min(this._pano.viewWidth,this._pano.viewHeight);

            this._startDist = p1.distanceTo(p2) + this._tick;

            //this._centerOffset = viewCenter.subtract(this._startCenter);
            this._oriZoom = this._pano.getZoom();
            //P.logger("ori zoom : " + this._oriZoom + " , distance : " + this._startDist);

            P.on(this._pano._dragMask, 'touchmove', this._onTouchMove, this)
                .on(this._pano._dragMask, 'touchend', this._onTouchEnd, this);
            dom.event.preventDefault(e);
        },

        _onTouchMove: function (e) {

            if (e.touches && e.touches.length <2) {
                //this._lookat = null;
                this._onactive = false;
                return;
            }

            var pano = this._pano;

            if(this._onactive == false) return;

            var p1 = new Point(e.touches[0].clientX, e.touches[0].clientY),
                p2 = new Point(e.touches[1].clientX, e.touches[1].clientY);


            this._scale = (p1.distanceTo(p2) + this._tick) / this._startDist;

            //缩放中心偏移
            //this._delta = p1.interpolate(p2, 0.5).subtract(this._startCenter);

            if (this._zoomed == false) {
                dom.addClass(pano._viewport, 'pano-touching');
                // trigger pano event
                pano
                    //.trigger('movestart')
                    .trigger('zoomstart');

                this._zoomed = true;
            }

            //非递增 禁止updatetiles
            pano.setZoom(this._oriZoom * (1/this._scale) , false , false,this._lookat);
            //P.logger("distance : " + p1.distanceTo(p2) + " , Dist : " + this._startDist + ", orizoom :" + this._oriZoom + " , scale : " + this._scale);
            //pano._panTo(this._povCenter , this._startCenter);
            dom.event.preventDefault(e);
        },

        _onTouchEnd: function () {

            var pano = this._pano;

            this._onactive = false;
            this._zoomed = false;
            dom.removeClass(_pano._viewport, 'pano-touching');

/*            P
                .un(document, 'touchmove', this._onTouchMove)
                .un(document, 'touchend', this._onTouchEnd);*/

            //P._pano.render();
        },

        _getScaleOrigin: function () {
            var co = this._centerOffset.subtract(this._delta).divideBy(this._scale);
            return this._startCenter.add(co);
        }
    })

    return PinchZoom;
})
P.module('P.interaction.WheelZoom',['P.interaction.Interaction','P.base.events','P.base.dom','P.anim.Anim'],function(interaction,events,dom,anim){
    function wheelZoom(pano){
        interaction.call(this,pano);
    }

    P.inherit(wheelZoom, interaction , {
        lookat : null , tick:false, count : 1,

        activate: function () {
            dom.on(this._pano._dragMask, "mousewheel", this._onMouseWheel, this);
        },

        deactivate: function () {
            dom.un(this._pano._dragMask, "mousewheel", this._onMouseWheel)
        },

        _doZoom : function(){

        },

        _onMouseWheel: function (e) {
            var delta = dom.event.getWheelDelta(e);
            //this.tick = true;
            var d = 0.004 * delta;
            //this.count += (delta < 0 : 1 : -1);
            var lookat = {x:e.clientX , y:e.clientY};

            /* this._startTime  = P.now();

             P.requestAnimationFrame(P.bind(this._doZoom , this) );

             if(this._pano.hasAnimation(this.timeline))
             {
             //this._pano.removeAnimation( this.timeline );
             this.count += (delta > 0 ? 1 : -1);
             }else{
             this._pano.frameSnapshot();
             this.count = (delta > 0 ? 1 : -1);
             }

             */

            anim.loop({
                duration : 300,
                onUpdate : P.bind(this._pano.setZoom, this._pano, d, true,false , lookat),
                onComplete : P.bind(this._pano.render , this._pano)
            });


            /*
             if(this.timeline) this._pano.removeAnimation( this.timeline );
             this.timeline = P.animation.zoom({zoom : this._pano.zoom + this.count*-0.1 , duration:300, lookat : lookat});
             console.log(this.count)
             this._pano.addAnimation( this.timeline )
             */


            dom.event.preventDefault(e);
            dom.event.stopPropagation(e);

            //P.logger("event : mousewhell , delta = " + delta);

        }
    })

    return wheelZoom;

})
/**
 *  this render support all browers include  gt1e9 and android 3.x
 *  but only support for cube mode.
 *
 * */

 P.module('P.render.CssRender',[],function(){
    function CssRender(pano){
        this._pano = pano;
        this.prefix = P.prefix.css + "transform";
    }

    CssRender.prototype = {
        arc: 0,

        _focus: 200,

        calcPitch: 0,

        options: {},

        _invalidate: function () {
            //this._pano._scene._checkTexture();
            var renderlist = this._pano._scene._tiles;
            var pre = this.prefix;

            this._focus = this._pano._camera._focus;

            for (var i in renderlist) {
                //if(window.aaa===undefined) {alert( renderlist[i].obj.style);window.aaa=1;}
                renderlist[i].obj.style[pre] = this.getTransform(renderlist[i].transform);

            }

        },

        render: function () {

            this._invalidate();
        },

        getTransform: function (tf) {
            var size = this._pano._scene.size;
            var vw = this._pano.getViewWidth(), vh = this._pano.getViewHeight();
            var fos = this._focus;

            // PC : chrome 37.0 + CSSRender ,
            // issure: perspecive == translateZ && heading=0 时 某些面不可见，为 translateZ +加一个极小值
            return "translate3d(" + vw / 2 + "px, " + vh / 2 + "px, 0px) translateY(" + this.arc + "px) perspective(" + fos + "px) rotateZ(0deg) translateZ(" + (fos + 1e-10) + "px) rotateX(" + this.calcPitch + "deg) rotateY(" + this._pano.heading + "deg) " + tf;
        },

        setMode: function (m) {
            this.mode = m;
            this._update();
        },

        _update: function () {
            //二次贝塞尔
            //B(t) = (1-t)*(1-t) * P0 + 2t*(1-t)*P1 + t*t*P2 ,t = [0,1]
            if (this.mode == "architectural") {
                var t = Math.abs(this._pano.pitch / 90), s = this._pano.pitch < 0 ? 1 : -1;
                this.calcPitch = t * t * 90 * s;
                this.arc = 2 * t * (1 - t) * this._pano.focus * 1.22222 * s;

            } else {
                this.calcPitch = -this._pano.pitch;
                this.arc = 0;
            }
        }
    }

    return CssRender;
})
P.module('P.render.WebGLRender',[],function(){
    function webglRender(view){
        this.view = view;
    }

    webglRender.prototype = {

        _indraw : false ,


        render : function(){
            if(webgl.gl == undefined) return;

            this.multiresDraw();

        },

        _update : function(){},


        multiresDraw : function(v) {
            var scene = this.view._scene;
            // 设置 投影矩阵 视图矩阵
            webgl.set({
                "u_persp" : this.view._camera.getProjectionMatrix()
                ,"u_view" : this.view._camera.getViewMatrix()
            })


            var renderables = scene._tiles;

            if (!this._indraw) {
                this._indraw = true;
                for ( var i in renderables ) {
                    webgl.set({
                        "a_vp" : scene.data.vertBuffer.data( renderables[i].vertices )
                        ,"a_tp" :  scene.data.texBuffer
                        //,"a_alpha":0.5
                    })
                        .bindTexture(renderables[i].texture)
                        .draw(scene.data.indexBuffer);
                }
                this._indraw = false;

            }

        }
    }

    return webglRender;
})

 P.module('P.render.BasicRender',[],function(){
    function BasicRender(pano){
        this._pano = pano;
        this.prefix = P.prefix.css;
    }

     BasicRender.prototype = {

         _nextFrame:false,

         render: function () {
             if(this._nextFrame == true) return;
             this._nextFrame = true;
             P.requestAnimationFrame(P.bind(this._invalidate , this));
         },

         _update : function(){},

         _invalidate : function(){
             //this._pano._scene._checkTexture();
             var renderlist = this._pano._scene._tiles;

             var size = this._pano._scene.tilesize;
             var f = this._pano._camera._focus;
             var h = this._pano.getViewHeight();
             var ww = this._pano.viewWidth * 0.5;
             var wh = this._pano.viewHeight * 0.5;



             var scale = this._pano._camera._focus / this._pano._scene.tilesize;

             var size_r = size * scale;//size * (1 + scale - (1 << this._pano.getDeep())) * ( 1 << this._pano.getDeep());

             var deep = this._pano.getDeep();



             var tx = size * 4 * scale * this._pano.getHeading(false) / 360;

             var ty = size * 1 * scale * ( this._pano.getPitch()) /90;

             var tp = Math.floor(this._pano.getHeading(false) / 360);

             var tp_m = this._pano.getHeading(false) / 360 % 1;

             var flag = tp<0 ? (tp_m > -0.5 && tp_m <0.5) : tp_m>0.5;

             //console.log(scale)
             this._pano._viewport.style["left"] = Math.floor(ww - tx)+"px";
             //console.log(Math.floor(ww-tx))
             this._pano._viewport.style["top"] = Math.floor((wh - size_r*.5)-ty)+"px";

             for(var i in renderlist)
             {

                 var t = renderlist[i];

                 var size_d , scale_d;
                 //renderlist[i].obj.style[pre] = this.getTransform( renderlist[i].transform );
                 //console.log(scale_d+"==<")
                 if(t.z<0){
                     // this is preview
                     // var tox = t.x * 4* scale * size
                     //if(t.x == 0)


                     var u =  scale * size ;
                     // 不能在此处 floor 否则会

                     renderlist[i].obj.style["top"] =  t.y*u + "px";

                     renderlist[i].obj.width = Math.ceil(u) * 4;

                     renderlist[i].obj.height = Math.ceil(u);


                     //renderlist[i].obj.style["left"] = t.x*(scale * size)+"px";
                     //[0.5,1]

                     if(flag) {
                         if (t.x == 0) {
                             renderlist[i].obj.style["left"] = tp * u * 4 + "px";

                         }
                         if (t.x == -1) {
                             renderlist[i].obj.style["left"] = (tp + 1) * u * 4 + "px";
                         }
                     }else
                     {
                         if (t.x == 0) {
                             renderlist[i].obj.style["left"] = (tp-1) * u * 4 + "px";

                         }
                         if (t.x == -1) {
                             renderlist[i].obj.style["left"] = (tp) * u * 4 + "px";
                         }
                     }

                     //console.log("==>"+tp)

                 }else
                 {
                     //级别 z 需要的scale
                     scale_d = scale / (1<<t.z);
                     size_d = size * scale_d;
                     //size_d = size_r;
                     //console.log(t.z);
                     renderlist[i].obj.style["top"] = Math.floor(t.y*size_d)+"px";
                     renderlist[i].obj.style["left"] = Math.floor(t.x*size_d)+"px";

                     renderlist[i].obj.width = renderlist[i].obj.height = Math.ceil(size_d);//+"px";
                 }
             }
             //console.log("==>"+size_r)


             this._nextFrame = false;
         }
    }

    return BasicRender;
})
P.module('P.overlays.LabelLayer',['P.core.geom.spherical'],function(spherical){
    function LabelLayer(pano){
        this._pano = pano;
        this._list = {};
        //this._sceneReady = false;
        this.init();
    }

    LabelLayer.prototype = {
        init : function(){
            this._el = P.creat("div" , null , "pano-layers-label" , this._pano._control , "transform: translateZ(1000000000000px); z-index: 2002; position: absolute; left: 0px; top: 0px; ");
        },

        _calcCoord : function(v){

            //本地方式
            var p = v.options.position;
            //console.log(p)
            if(v.options.local)
                return {y:p.lat , x:p.lng};
            else {
                //TODO
                var ix = spherical.computeHeading(this._pano.getLocation().latLng, p) + (360 - this._pano._panoData.tiles.centerHeading);
                var dist = spherical.computeDistance(this._pano.getLocation().latLng , p);
                var iy = 0 - Math.atan(v.getAltitude() / dist) * 180 / Math.PI;
                v.setDistance(dist);
                //L(this._pano.getLocation().latLng,p,ix,"center heading:"+this._pano._panoData.tiles.centerHeading,"===<")
                return {y: iy, x: ix};
            }
        },

        _calcDist : function(v){
            if(v.options.local)
                return v.options.distance;
            else{
                return spherical.computeDistance(this._pano.getLocation().latLng , v.options.position);
            }

        },

        draw : function(target){
            if(target){
                this._drawItem(target._id);
            }else{
                for(var id in this._list)
                {
                    this._drawItem(id)
                }
            }
        },

        _drawItem:function(id)
        {

            var cur = this._list[id],
                p = this._pano._camera._projectSphere( cur.sphereCoord );

            if(p)
                cur.obj.setVisible(true)._moveTo(p);
            else
                cur.obj.setVisible(false);
        },

        update : function(v){
            this._list[v._id].sphereCoord = this._calcCoord(v);
            this.draw( v );
        },

        add : function(v){
            console.log('add:')
            console.log(v);
            this._el.appendChild(v._el);
            this._list[v._id] = {obj : v , sphereCoord : this._calcCoord(v) , dist : this._calcDist(v)};

            this.draw( v );
        },

        remove : function(v){
            var id = v.obj._id;

            this._el.removeChild(v.obj._el);
            delete this._list[id];
        },

        clear : function(){
            for(var i in this._list)
            {
                this.remove( this._list[i]);
            }
        }
    };

    return LabelLayer;
});
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
P.module("P.overlays.Overlay",[
    'P.core.geom.Point',
    'P.core.geom.Latlng'
],function(Point,Latlng){
    var Overlay = function(opts){
        this.options = {position : new Latlng() , altitude : 0 , content : "", visible:true, pano : null , type : "" , local : false , scale : 0.8};
        this._pano = null;
        this._labelLayer = null;
        //this._id = P.stamp(this);
        //console.log(this._id)
        this.pre = P.prefix.css+"transform";
        //P.Utils.extend(this, P.base.events);
    }

    Overlay.prototype = {
        init : function(){},

        getPano:function(){ return this._pano; },

        getPosition : function(){ return this.options.position;},

        getAltitude : function(){ return this.options.altitude; },

        setPano : function(pano){
            if(pano === null){
                if(this._labelLayer){

                    this._labelLayer.remove(this);
                    this._labelLayer = null;
                }
                if( this._pano  ) this._pano = null;
                return this;
            }
            this._pano = pano;
            this._labelLayer = pano._labelLayer;
            this._labelLayer.add(this);
            //if(this.local == false) this.setLocation();
            return this;

        },
        setVisible:function(v){
            if(this.options.visible != v)
            {
                this.options.visible = v;
                this._el.style.display = v ? "block" : "none";

            }
            return this;
        },
        setPosition : function(v){
            this.options.position = v ;
            this._draw();
            return this;
        },

        setLocation : function(o){
            if(o.altitude)
            {
                this.options.position = o.position;
                this.options.altitude = o.altitude;
                this.options.local = false;
            }
            if(o.distance)
            {
                this.options.position = o.position;
                this.options.distance = o.distance;
                this.options.local =  true;
                //console.log(this.position)
                this.setDistance(o.distance);
            }
            //this._el.style.transform = "scale("+scale+","+scale+")";
            return this;
        },

        setDistance : function(d){
            var scale = (120 - d) / 120;
            //alert(scale)
            scale = 0.9 * scale + 0.6 * (1-scale);
            this.options.scale = scale;
            this._el.style.transform = "scale("+scale+","+scale+")";
            if(d>120) this._el.style.visibility = "hidden";
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        },
        _moveTo : function(v){
            //console.log(this._el)
            //var l = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate(-px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px)";
            //var ix = v.x + this.options.size[0]*-0.5 , iy = v.y + this.options.size[0]*-1;
            this._el.style[this.pre] = "translateX("+ v.x+"px) translateY("+ v.y+"px)";
            //this._el.style[this.pre] = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate("+this.options.size[0]*0.5+"px, "+(-this.options.size[1])+"px) rotate(0deg) translate(0px, 0px) scale(1,1) translate(0px, 0px)";

            //console.log(this.options.type)
            //console.log(this._el.style[this.pre+"Transform"])

            // left top
            //var ix = v.x + this.options.size[0]*-0.5 , iy = v.y + this.options.size[0]*-1;
            /*this._el.style.left = Math.round(ix)+"px";
             this._el.style.top  = Math.round(iy) + "px";*/

        }
    };
    //Camera3D.prototype = new away3d.Object3D();

    return Overlay;
});
P.module("P.overlays.Icon",[
    'P.core.geom.Latlng',
    "P.overlays.Overlay",
    "P.base.utils"
],function(Latlng,Overlay,utils){
    var Icon = function(opts){
        this.options = {size:[64,128],position : new Latlng() , content : "", visible:true, pano : null , type : "icon" ,local : true};
        P.setOptions(this, opts);
        this._id = utils.stamp(this);
        this.init();

    }
    Icon.prototype = new Overlay();

    Icon.prototype.constructor = Icon;

    Icon.prototype.init = function(){
        var w = this.options.size[0];
        var h = this.options.size[1];

        this._el = P.creat("div" , null , "pano-overlay-icon", null, "position: absolute; left: 0px; top: 0px;display:block;padding:0px;color:#fff;transform-origin: 50% 50%; "+this.pre+":translate(0px,0px);",{action:this.options.action});
        // top : left;
        //this._el = P.creat("div" , null , "pano-overlay-icon", null, "position: absolute; left: 0px; top: 0px;display:block;padding:0px;",{action:opts.action});
        this._contentDiv = P.creat("div",null,"pano-icon-content",this._el,"background:url("+this.options.image+");width:"+w+"px;height:"+h+"px;position:absolute;top:"+(-h)+"px;left:"+(-w/2)+"px");

        if(this.options.position) this.setPosition(this.options.position);

        if(this.options.pano) this.setPano(this.options.pano);

        this._regListeners();
    }

    Icon.prototype._regListeners = function(){
        P.on(this._contentDiv,"click",this._onClick,this);
    }

    Icon.prototype._onClick = function(e){
        var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
        action = action.split(",");

        if(action[0]=="setPano") this._pano.setPano(action[1]);
        else this._pano.get.apply(this._pano ,action );
    }

    P.icon = function(opts){ return new P.overlays.Icon(opts);}

    return Icon;
});


P.module('P.overlays.Label',[
    'P.core.geom.Latlng',
    'P.overlays.Overlay',
    'P.base.utils',
    'P.base.events'
],function(Latlng, Overlay, utils , events){

    //P.overlays = {};

    function Label(opts)
    {
        this.options = {position : new Latlng() , altitude : 0 , content : "", visible:true, pano : null , type : "" , local : false , scale : 0.8};
        this._pano = null;
        this._labelLayer = null;
        this._icon = {url:"" , size : {w:54 , h:54}}

        this._id = P.stamp(this);

        this.init(opts);
    }

    P.inherit(Label,Overlay,{
        mixin : events,

        setContent : function( v ){
            this._contentDiv.innerHTML = v;

            var w = utils.getLength(v);


            this._el.style.width = (this._icon.size.w + w) + "px";
            console.log(this._el.style);
            if(v) this._contentDiv.style.display = "block";
            else this._contentDiv.style.display = "none";
            this._draw();
            return this;

/*            if(v == "") this._contentDiv.style.display = "none";
            else this._contentDiv.style.display = "block";*/
        },

        init : function(opts){


            P.setOptions(this, opts);

            var cls = this.options.type != "" ? (" label-"+this.options.type):"";

            this._el = P.creat("div" , null , "pano-overlay-label"+cls, null, "position: absolute; left: 0px; top: 0px;display:block;",{action:opts.action});

            this._iconDiv = P.creat("img",null,null,this._el,"");

            this._contentDiv = P.creat("span",null,null,this._el,"");

            if(this.options.type != "")
                this._iconDiv.src = "assets/icons/"+ this.options.type+".png";

            //if(this.options.type) P.creat("div" , null , "pano-overlay-labelIcon"+cls , this.el, "position: absolute; left: 0px; top: 0px;display:block;");

            if(this.options.content)
                this.setContent(this.options.content);

            if(this.options.location)
                this.setLocation(this.options.location);

            if(this.options.pano)
                this.setPano(this.options.pano);

            this._regListeners();

        },


        _regListeners:function(){
            P.on(this._el,"click",this._onClick,this);
            //P.on(this._el,"touchend",this._onClick,this);
            /* this._dragObj = new P.proto.DragObject(this._el, this);

             this._dragObj.on({
             'dragstart': this._onDragStart,
             'dragend': this._onDragEnd
             }, this).activate();
             P.on(this._el,)*/
        },
        _onClick : function(e){

            var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
            action = action.split(",");

            if(action[0]=="setPano") this._pano.setPano(action[1]);
            else this._pano.get.apply(this._pano ,action );
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        }
    })
    /*Label.prototype = {



        _moveTo : function(v){
            this._el.style.left = Math.round(v.x)+"px";
            this._el.style.top = Math.round(v.y) + "px";

        },

        getPano:function(){ return this._pano; },

        getPosition : function(){ return this.options.position;},

        getAltitude : function(){ return this.options.altitude; },

        getContent : function(){ return this.options.content},

        getVisible : function()
        {
            return this.options._visiable;
        },

        setPano : function(pano){
            if(pano === null){
                if(this._labelLayer){

                    this._labelLayer.remove(this);
                    this._labelLayer = null;
                }
                if( this._pano  ) this._pano = null;
                return this;
            }
            this._pano = pano;
            this._labelLayer = pano._labelLayer;
            this._labelLayer.add(this);
            //if(this.local == false) this.setLocation();
            return this;

        },
        _reset:function(){

        },
        setPosition : function(v){
            this.options.position = v ;
            this._draw();
            return this;
        },

        setAltitude : function( v ){  this.options.altitude = v; this._draw(); return this; },

        setContent : function( v ){
            this._contentDiv.innerHTML = this.options._content = v;
            if(v == "") this._contentDiv.style.display = "none";
            else this._contentDiv.style.display = "block";
            this._draw();
            return this;
        },

        setVisible:function(v){
            if(this.options.visible != v)
            {
                this.options.visible = v;
                this._el.style.display = v ? "block" : "none";

            }
            return this;
        },

        setLocation : function(o){
            if(o.altitude)
            {
                this.options.position = o.position;
                this.options.altitude = o.altitude;
                this.options.local = false;
            }
            if(o.distance)
            {
                this.options.position = o.position;
                this.options.distance = o.distance;
                this.options.local =  true;
                //console.log(this.position)
                this.setDistance(o.distance);
            }
            //this._el.style.transform = "scale("+scale+","+scale+")";
            return this;
        }
        ,

        setDistance : function(d){
            var scale = (120 - d) / 120;
            //alert(scale)
            scale = 0.9 * scale + 0.6 * (1-scale);
            this.options.scale = scale;
            this._el.style.transform = "scale("+scale+","+scale+")";
            if(d>120) this._el.style.visibility = "hidden";
        }

    }*/

    //factory

    P.label = function(opts){ return new Label(opts); }

    return Label;
})
P.module('P.overlays.Span',['P.core.geom.Latlng','P.base.utils'],function(Latlng , utils){

    function Span(opts){
        this.options = {position : new Latlng() , content : "", visible:true, pano : null , type : "" ,local : true};
        this._pano = null;
        this._labelLayer = null;
        this._id = P.stamp(this);
        // mixin
        this.w = 60;
        this.pre = P.prefix.css + "transform";
        //混入
        P.extend(this, P.base.events);
        this.init(opts);
    }

    Span.prototype = {
        //pre:'transform-origin: 50% 50% 0px; width: 63px; height: 34px; transform: translateZ(0px) translate({x}px, {y}px) translate(-31.5px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px);'
        init : function(opts){
            // this.options = {};
            //alert("init : "+opts)
            P.setOptions(this, opts);
            //position: absolute; z-index: 2001; overflow: visible; cursor: pointer; pointer-events: auto; opacity: 0.8;

            this._el = P.creat("div" , null , "pano-overlay-span", null, "position: absolute; left: 0px; top: 0px;display:block;padding:3px;color:#fff;transform-origin: 50% 50% 0px; height: 34px; "+this.pre+":translate(0px,0px);",{action:opts.action});
            this._contentDiv = P.creat("span",null,"pano-span-content",this._el,"background:#000;padding:3px 5px;");
            this._arrow = P.creat("span",null,"pano-span-arrow",this._el);
            if(this.options.content != "") this.setContent(this.options.content);
            if(this.options.position) this.setPosition(this.options.position);
            if(this.options.pano) this.setPano(this.options.pano);
            this._regListeners();
        },

        _regListeners:function(){
            P.on(this._el,"click",this._onClick,this);
        },

        _onClick : function(e){
            var action = P.data(e.target.parentNode || e.srcElement.parentNode, "action") || "";
            action = action.split(",");
            //console.log(action)
            if(action[0]=="setPano") this._pano.setPano(action[1]);
            else this._pano.call.apply(this._pano ,action );
        },

        _draw : function(){
            if(this._labelLayer)  this._labelLayer.update(this);
        },


        _moveTo : function(v){

            var l = "translate("+ v.x+"px, "+v.y+"px) translate(-px, -17px) rotate(0deg) translate(0px, 0px) scale(1, 1) translate(0px, 0px)";
            this._el.style[this.pre] = "translateZ(0px) translate("+ v.x+"px, "+v.y+"px) translate(-"+this.w/2+"px, -20px) rotate(0deg) translate(0px, 0px) scale(1,1) translate(0px, 0px)";
            //console.log(this._el.style[this.pre+"Transform"])
            //this._el.style.left = Math.round(v.x)+"px";
            //this._el.style.top = Math.round(v.y) + "px";

        },

        /*getPano:function(){ return this._pano; },

         getPosition : function(){ return this.options.position;},

         getContent : function(){ return this.options.content},

         getVisible : function()
         {
         return this.options._visiable;
         },
         */
        setPano : function(pano){
            if(pano === null){
                if(this._labelLayer){

                    this._labelLayer.remove(this);
                    this._labelLayer = null;
                }
                if( this._pano  ) this._pano = null;
                return this;
            }
            this._pano = pano;
            this._labelLayer = pano._labelLayer;
            this._labelLayer.add(this);
            //if(this.local == false) this.setLocation();
            return this;

        },
        _reset:function(){

        },
        setPosition : function(v){
            this.options.position = v ;
            this._draw();
            return this;
        },

        setContent : function( v ){
            this._contentDiv.innerHTML = this.options._content = v;
            this.w = utils.getLength(v);
            this._contentDiv.style.width = this.w+"px";
            if(v == "") this._contentDiv.style.display = "none";
            else this._contentDiv.style.display = "block";
            this._draw();
            return this;
        },

        setVisible:function(v){
            if(this.options.visible != v)
            {
                this.options.visible = v;
                this._el.style.display = v ? "block" : "none";

            }
            return this;
        }

    }
    //factory
    P.span = function(opts){ return new Span(opts);}
    return Span
})
/**
 * BasicProvider 单一场景
 */

P.module('P.provider.BasicProvider',['P.base.feature','P.base.utils'],function(feature,utils){
    function BasicProvider(opts){
        this.options = {render: "auto" , multires : true , fov:120 , url : "" , getTile : null , size : 512 , onceMode : false , faceurl : false , sync:true};

        this.ready = false;

        this.data = {};

        P.setOptions(this, opts);
        //this._url = this.options.url;
        this.maxDeep = (feature.mobile && this.options.maxDeep>1)?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;
        this.onceMode = this.options.onceMode || (feature.mobile && this.maxDeep<=1);
    }

    BasicProvider.prototype = {

        _creatTileData:function(id){
            return {
                "location": {
                    "latLng":{lat: 0 , lng: 0},
                    "description":"",
                    "pano":id
                },
                "imageDate": "",
                "copyright": "",
                "links": [],
                "tiles": {
                    "worldSize": null,
                    "tileSize": this.options.size,
                    "centerHeading": 0,
                    "getTileUrl": P.bind(this.getTile , this)
                }
            }
        },

        // return PanoTileData;
        getPanoById : function(id) {
            return this.data[id] ? this.data[id].panoData : this._creatTileData(id);
        },

        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id){
            return this.data[id] ? this.data[id].poiData : [];
        },

        getTile: function (v) {

            if(typeof(this.options.getTile) == "function")
            {
                return this.options.getTile(v);
            }else
            {
                if(v == "preview" || v.z == '-1') return this.options.preview;
                else {
                    if(this.options.faceurl == false)
                    {
                        var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                        v.x += l[v.f] * (1<< v.z);
                    }
                    console.log(v)
                    return utils.template(this.options.url, v);
                }
            }
        }
    };

    return BasicProvider;
})
/**
 * 本地场景组
 * */
P.module('P.provider.LocalProvider',['P.base.feature'],function(feature){
    function HQTProvider(opts){
        this.options = {render: "auto", multires: true, type: "cube" , server : "" , server_pois : "" , size : 256 , fov:120 , maxDeep:3 , maxpixelzoom : 1};

        this.sync = true;


        P.setOptions(this, opts);
        this.options.server += "{panoid}/"
        this.options.tiles_tpl = this.options.server + "tiles/cube/";
        this.maxDeep = P.feature.mobile?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;

    }

    HQTProvider.prototype = {

        _parse : function(id){
            return code.decode(id);
        },

        getPanoById : function(id) {
            var o = this._parse(id);
            //console.log(o);
            return {
                "location": {
                    "latLng":{lat: o.lat , lng: o.lng},
                    "description":"",
                    "pano":id
                },
                "copyright": "HQT",
                "imageDate": o.time,
                "links": [/*{
                 "heading": 0,
                 "description": string,
                 "pano": string,
                 "roadColor": string,
                 "roadOpacity": number
                 }*/],
                "tiles": {
                    "worldSize": null,
                    "tileSize": 256,
                    "centerHeading": o.dir,
                    "getTileUrl": P.bind(this.getTile , this)
                }
            }
        }
        ,
        getPanoByLocation:function(){
            return {};
        },

        getThumbById : function(id){
            return P.utils.template(this.options.server , {panoid:id}) +"thumb.jpg";;
        },

        getTile : function(v){

            if(v.z == -1) return P.utils.template(this.options.tiles_tpl , v) +"preview.jpg";


            var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
            v.x += l[v.f] * (1<< v.z);

            return P.utils.template(this.options.tiles_tpl+"{z}/{x},{y}.jpg", v);

        }
    };

    return HQTProvider;
})
/**
 * 本地场景组
 * */
P.module('P.provider.LocalProvider',['P.base.feature','P.base.code'],function(feature,code){
    function LocalProvider(opts){
        P.setOptions(this,opts);
        this.options = {render: "auto" , multires : true , fov:120 , tiles_tpl : "" , getTile : null , size : 256 , onceMode : false , faceurl : false , maxpixelzoom:1 , ignoneLv0:false};

        this.ready = false;

        this.data = {};

        P.setOptions(this, opts);
        //this._url = this.options.url;
        this.maxDeep = (feature.mobile && this.options.maxDeep>1)?1:this.options.maxDeep;
        this.maxZoom = 1<<this.maxDeep;
        this.onceMode = this.options.onceMode || (feature.mobile && this.maxDeep<=1);

        this.renderPreview = this.options.renderPreview === true ? true : false;
        //this.displayPoi =  this.options.displayPoi === true ? true : false;
        //本地数据

        if(this.options.data) this.localParse(this.options.data);
    }

    LocalProvider.prototype = {

        localParse:function(d){
            var data = {} , id , pano , copyright = d.owner;
            //console.log( copyright)

            for(var i=0;i<d.scene.length;i++)
            {
                pano = d.scene[i].pano;
                for(var j=0;j< pano.length;j++)
                {
                    id = pano[j].id;

                    data[id] = { panoData:this.localCreatPanoData(pano[j],copyright), poiData: pano[j].pois , raw: pano[j]}
                }
            }
            this.data = data;
        },

        localCreatPanoData:function(data,copyright){
            var id = data.id,
                title = data.title,
                links = data.links;

            var d = {};
            title = title || "";
            links = links || [];
            copyright = copyright || "";
            var getTile = function(){return ""};



            if(id.length == 27) {
                getTile = P.provider.ResProvider["HQT"].getTile;
                d = code.decode(id);
            }
            else if(id.length == 23) {
                getTile = P.provider.ResProvider["QQ"].getTile;

                d.lat = (data.lat !== undefined) ? data.lat : 0;

                d.lng = (data.lng !== undefined) ? data.lng : 0;

                d.time = "20"+id.substring(8,10)+"-"+id.substring(10,12);

                d.dir = (data.dir !== undefined) ? data.dir : 0;
            }else{
                getTile = P.provider.ResProvider["COMMON"].getTile;

                d.lat = 0;

                d.lng = 0;

                d.time = "1970-01-01";

                d.dir = 0;
            }

            //console.log(d);
            return {
                "location": {
                    "latLng":{lat: d.lat , lng: d.lng},
                    "description":title,
                    "pano":id
                },
                "imageDate": d.time,
                "copyright": copyright,
                "links": links/*[{
                 "heading": 0,
                 "description": string,
                 "pano": string,
                 "roadColor": string,
                 "roadOpacity": number
                 }]*/,
                "tiles": {
                    "worldSize": null,
                    "tileSize": this.options.size,
                    "centerHeading": d.dir,
                    "getTileUrl": getTile
                }
            }
        },

        // return PanoTileData;
        getPanoById : function(id) {
            return this.data[id] ? this.data[id].panoData : this.localCreatPanoData(id);
        },

        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id){
            return this.data[id] ? this.data[id].poiData : [];
        },

        getThumbById : function(id){
            if(id.length == 27) return P.provider.ResProvider["HQT"].getThumb(id);
            else if(id.length == 23) return P.provider.ResProvider["QQ"].getThumb(id);
            else return P.provider.ResProvider["COMMON"].getThumb(id);
        }
    };

    return LocalProvider;
})
P.module('P.provider.Provider',['P.base.utils'],function(utils){
    function provider(){

    }

    provider.prototype = {

        sync : true ,

        getPanoById : function(){

        },

        getPanoByLocation:function(){

        },

        getPoiById : function(){},

        getThumbById : function(){}
    };

    P.provider.ResProvider = {
        "COMMON" : {
            getTile : function(v){
                var server = "pano/{panoid}/";
                var tiles_tpl = server + "tiles/cube/";
                if(v.z == -1) return utils.template(tiles_tpl , v) +"preview.jpg";

                var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                v.x += l[v.f] * (1<< v.z);

                return utils.template(tiles_tpl+"{z}/{x},{y}.jpg", v);
            },
            getThumb : function(id){
                var server = "pano/{panoid}/";
                return utils.template(server , {panoid:id}) +"thumb.jpg";
            }
        },
        "HQT":{
            getTile:function(v){
                var server = "pano/{panoid}/";
                var tiles_tpl = server + "tiles/cube/";

                if(v.z == -1) return utils.template(tiles_tpl , v) +"preview.jpg";

                var l = {"f":0,"r":1,"b":2,"l":3,"u":4,"d":5};
                v.x += l[v.f] * (1<< v.z);

                return utils.template(tiles_tpl+"{z}/{x},{y}.jpg", v);
            },
            getThumb : function(id){
                var server = "pano/{panoid}/";
                return utils.template(server , {panoid:id}) +"thumb.jpg";
            }
        },
        "QQ":{
            getTile : function(o){

                var _tpl = "http://sv{r7}.map.qq.com/tile?svid={panoid}&x={x}&y={y}&level={z}&mtype=mobile-cube&from=web";

                var _pre = "http://sv0.map.qq.com/thumb?svid={panoid}&x=0&y=0&level=0&mtype=mobile-cube";

                var _poi ="http://sv.map.soso.com/poi3d?x={lng}&y={lat}&source=qq&type=street&output=jsonp&cb=?&token="+new Date().getTime();

                if(o.z == '-1'){
                    console.log( o )
                }
                if(o.z == -1) return utils.template(_pre , o);

                var iz = o.z; o.z = o.z - 1;
                var num = 1 << iz;

                //qq级别-1;
                var z = o.z;
                var l = {f:0 , r:1 , b:2 , l:3 , u:4, d:5};
                o.x = l[o.f]*num + o.x;
                o.r7 = l[o.f];//Math.floor(Math.random() * 7);

                delete o.f;
                return utils.template( _tpl , o);
            }
            ,
            getThumb:function(id){
                return "http://capture.map.qq.com/screenshot?model=web&from=qqmap&zoom=0&fov=60&width=188&height=106&pano="+id+"&pitch=0&heading=0";
            }
        }
    }

    return provider;
})
/**
 * QQ StreetView Provider
 * cube方式，6x1 展开，提供两级，瓦片大小256x256
 * 暂时 支持 mobile 小分辨率
 * 暂不 支持 多分辨率
 *
 * */

P.module('P.provider.QQProvider',[
    'P.provider.Provider',
    'P.base.feature'
 ],function(feature){
    function QQProvider(opts){
        P.setOptions(this, opts);
        //this.options.svid =
        //this.options.tiles_tpl = this.options.server;
        this.maxDeep = feature.mobile?1:this.options.maxDeep;
        this.minDeep = 1;
        this.maxZoom = 1<<this.maxDeep;
        this.key = this.options.key;
        this.multires  = true;
        if(this.key == undefined) {alert("QQProvider 需要提供开发者密钥！否则部分功能将失效.");}
        //this.svid = this.options.svid;

    }

    QQProvider.prototype = {

        options: {render: "auto", multires: true, type: "cube" , server : "" , server_pois : "" , size : 256 , fov:120 , maxDeep:2 , maxpixelzoom : 1 , ignoneLv0:true},

        sync : false,

        //svid:"",

        cfgpath: "http://sv.map.qq.com/sv?pf=html5&svid={panoid}&ch=&output=jsonp&cb=?&token="+new Date().getTime(),
        //proxy.asp?uri=
        _tpl: "http://sv{r7}.map.qq.com/tile?svid={panoid}&x={x}&y={y}&level={z}&mtype=mobile-cube&from=web",

        _pre: "http://sv0.map.qq.com/thumb?svid={panoid}&x=0&y=0&level=0&mtype=mobile-cube",

        _poi :"http://sv.map.soso.com/poi3d?x={lng}&y={lat}&source=qq&type=street&output=jsonp&cb=?&token="+new Date().getTime(),


        _parse : function(fn , d){
            //console.log(d)
            var dir = parseInt(d.detail.basic.dir);
            var pos = {lat:d.detail.addr.y_lat , lng:d.detail.addr.x_lng};
            var id = d.detail.basic.svid;
            var copyright = d.detail.basic.source;
            //L(d.detail.addr.y_lat,pos.lng);
            //console.log(pos)
            this._curpos = pos;
            //this._curpos = pos;
            //alert(pos.lat)
            //区域列表，qq默认是 building 作为大区域，floor 作为切换的子区域，
            //this.floors = d.detail.building.floors;
            // 相关所有场景 ,如果是室外 表示当前道路 可以到达区域
            this.scene = d.detail.all_scenes;

            fn({
                "location": {
                    "latLng":pos,
                    "description":"",
                    "pano":id
                },
                "copyright": "Tencent",
                "imageDate" : "20"+id.substring(8,10)+"-"+id.substring(10,12),
                "links": [/*{
                 "heading": 0,
                 "description": string,
                 "pano": string,
                 "roadColor": string,
                 "roadOpacity": number
                 }*/],
                "tiles": {
                    "worldSize": null,
                    "tileSize": 256,
                    "centerHeading": dir,
                    "getTileUrl": P.bind(P.provider.ResProvider.QQ.getTile , this)
                }
            });

        },

        _cates : {"房产小区":"building" , "娱乐休闲":"leisure", "美食":"food", "购物":"shopping", "生活服务":"service", "医疗保健":"aid","酒店宾馆":"hotel" , "教育学校":"building", "旅游景点":"building" , "文化广场":"building", "停车场":"parking","汽车":"", "银行金融":"bank", "电影院":"", "机构团体":""},

        _parseType : function(v){

            return this._cates[v];
        },


        _parsePoi : function(fn , data){
            data = data.detail.pois;
            var pois = [];
            for(var i=0;i<data.length;i++){
                pois[i] = {
                    position :  P.projection.EPSG3785To4326({lat : data[i].y , lng : data[i].x}),
                    content :  data[i].name,
                    altitude :   data[i].h,
                    id : data[i].uid,
                    type : this._parseType(data[i].catalog)
                }
            }

            fn(pois);
        },

        getPanoById : function(id , fn) {

            P.jsonp(this.cfgpath.replace("{panoid}", id), P.bind( this._parse , this , fn));

        }
        ,
        getPanoByLocation:function(){
            return {};
        },

        getPoiById : function(id, fn){
            // P.jsonp(this.cfgpath.replace("{panoid}", id), P.bind( this._parse , this , fn));
            var p = P.projection.EPSG4326To3785( this._curpos );

            P.jsonp(P.utils.template(this._poi, p) , P.bind(this._parsePoi , this , fn));
        },

        getThumbById : function(id){
            return "http://capture.map.qq.com/screenshot?model=web&from=qqmap&zoom=0&fov=60&width=188&height=106&pano="+id+"&pitch=0&heading=0"
        },

        getTile:function(o){

        }
    };

    return QQProvider;
})
