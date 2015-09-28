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
