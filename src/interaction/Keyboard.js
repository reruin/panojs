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