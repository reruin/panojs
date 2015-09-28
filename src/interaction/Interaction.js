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