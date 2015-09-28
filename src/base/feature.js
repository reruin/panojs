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