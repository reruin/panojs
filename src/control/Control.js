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