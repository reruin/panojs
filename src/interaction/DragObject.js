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