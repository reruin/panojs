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