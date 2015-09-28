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
