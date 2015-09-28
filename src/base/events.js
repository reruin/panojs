//用于事件混入 mixin events
P.module("P.base.events",[],function(){
    return {
        listeners: {},
        on: function (obj, scope) {
            for (var i in obj)
                this.addEventListener(i, obj[i], scope);
            return this;
        },

        un: function (obj) {
            for (var i in obj)
                this.removeEventListener(i, obj[i]);
            return this;
        },

        addEventListener: function (type, handler, scope) {
            var listeners = this.listeners[type];
            if (!listeners) {
                listeners = [];
                this.listeners[type] = listeners;
            }
            var listener = {instance: this, type: type, handler: handler, scope: scope || this};
            listeners.push(listener);
            return this;
        },
        removeEventListener: function (type, handler) {
            var listeners = this.listeners[type];
            if (listeners != null) {
                for (var i = 0, l = listeners.length; i < l; i++) {
                    if (listeners[i].handler == handler) {
                        listeners.splice(i, 1);
                        break;
                    }
                }
            }
            return this;
        },
        clearEventListeners: function (type) {
            var listeners = this.listeners[type];
            if (listeners != null) {
                for (var i = 0, len = listeners.length; i < len; i++) {

                    this.removeEventListener(type, listeners[i].handler)

                }
                this.listeners[type] = [];
            }

            return this;
        },
        trigger: function (type, evt) {
            var listeners = this.listeners[type] , continueChain;
            // fast path
            if (!listeners || listeners.length == 0) return this;

            evt = evt || {};
            evt.target = this;
            if (!evt.type)  evt.type = type;
            // copy array
            listeners = listeners.slice();
            //alert(listeners.length)
            for (var i = 0, len = listeners.length; i < len; i++) {
                var callback = listeners[i];

                continueChain = callback.handler.call(callback.scope, evt);
            }
            return this;
        }
    }
})