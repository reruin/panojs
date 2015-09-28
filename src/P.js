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

    P.version = '20150928';

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