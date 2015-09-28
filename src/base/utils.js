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
