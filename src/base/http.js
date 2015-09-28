P.module("P.base.http" , [],function(){
    var LoaderQueue = function (opts) {
        opts = opts || {};
        this.thread = opts.thread || 5;
        this.onUpdate = opts.onUpdate;
        this.onComplete = opts.onComplete;

        //初始化下载线程
        this.instances = [];
        for (var i = this.thread; i--;)
            this.instances[i] = new thread(this._next, this , this._error);


        this.task = []; // 任务列表
        this.free = true; // 加载器空闲
        this.status = 0;//加载器状态
    }

    LoaderQueue.prototype = {
        add: function (list) {
            this.task = list;
            this.status = 1;
            this._check()._start();
        }
        ,
        find: function (url) {
            for (var i = this.task.length; i--;) {
                if (this.task[i].url == url) return i;
            }
            return -1;
        },

        //检查 下载线程中 是否包含 队列项目 ，是则做以标记
        _check:function(){
            var index, i;
            for (i = this.instances.length; i--;) {
                if (this.instances[i].free !== true) {
                    index = this.find(this.instances[i].url);
                    if(index >= 0)
                        this.task[index].loading = true;
                }
            }
            return this;
        },

        remove: function (id) {

        },

        clear: function () {
            /*for (var i = this.thread; i--;)
                this.instances[i] = new thread(this._next, this , this._error);*/
            for(var i in this.task)
            {

            }
            this.task = [];
            this.status = 0;
        },

        _start: function () {
            this.free = false;

            for (var i = this.instances.length; i--;) {
                // 将任务分配到空闲进程
                if (this.instances[i].free) {
                    var q = this.setTask(this.instances[i]);
                    //已经没有任务
                    if (q == -1) {
                        return this;
                    }
                }
            }
            // 已经没有空闲进程
            return this;
        },
        /**
         * 加任务加入线程，返回任务id
         */

        setTask : function(thread){
            for (var i = 0, l = this.task.length; i < l; i++) {
                var itask = this.task[i];
                if (itask.loading !== true) {
                    itask.loading = true;
                    thread.start( itask );
                    return i;
                }
            }
            return -1;
        },


        // load 失败
        _error:function(thread){
            var index = this.find(thread.url);
            if (index != -1)
                this.task.splice(index, 1);
            else
                ;
            task.free = true;
        },

        _next: function (thread) {
            //根据下载线程 id 查找任务项
            var index = this.find(thread.url);

            //存在 则删除任务项
            if ( index >= 0 ){
                this.task.splice(index, 1);
                this.onUpdate(thread.data , thread.content);  //回调更新
            }

            //释放线程
            thread.free = true;

            //加任务加入线程，并判断 是否所有任务都已完成
            if( this.setTask(thread) == -1 ){
                this.free = true;
                this.status = 0;
                this.onComplete && this.onComplete();
            }
        }
    }

    function thread(cb, scope , error) {
        this.free = true;
        this.data = null;
        this.content = new Image();
        //this.content.crossOrigin = 'anonymous';
        this.retry = 3;
        this.id = "";
        this.fn = P.bind(cb, scope, this);
        this.error = P.bind(error,scope,this);
        this.url = '';
        this.start = function (o) {
            this.free = false;
            this.retry = 3;
            this.data = o;
            this.id = o.id;// this.url = o.url;
            this.content.src = this.url = o.url;
        };

        this.onerror = function( e ){

            if(--this.retry)
                this.content.src = this.content.src;
            else
                this.error(this);

        }

        this.init = function(){
            this.content.onload = this.fn;
            this.content.onerror = P.bind(this.onerror , this);
        }

        this.init();

    }


    function _request(o) {
        this.url = o.url || "";
        this.success = o.success || null;
        this.error = o.error || null;
        this.async = o.async || true;
        this.time = o.timeout || 3000;
        this.type = o.type || "GET";
        this.dataType = o.dataType || "";
        this.data = o.data || "";
        var self = this;
        if (this.url == "") return;

        if (window.XMLHttpRequest) {
            this._request = new XMLHttpRequest();
        } else {
            try {
                this._request = new ActiveXObject("Microsoft.XMLHTTP") || new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                alert("init error...");
                return;
            }
        }

        var timer = setTimeout(function () {
            if (typeof self.error == "function") self.error("timeout");
            if (self._request) {
                self._request.abort();
                self._request = null;
            }
            return true;
        }, this.time);

        this._request.open(this.type, this.url, this.async);
        if (this.type == "POST")
            this._request.setRequestHeader("CONTENT-TYPE", "application/x-www-form-urlencoded");
        this._request.send(this.data);

        this._request.onreadystatechange = function () {
            //console.log(self._request)
            if (self._request.readyState == 4 && self._request.status == 200) {
                var req = self._request;
                var ct = req.getResponseHeader("content-type");
                var res = !dataType && ct && ct.indexOf("xml") >= 0; //check is xml
                var dataType = self.dataType.toUpperCase();
                // if dataType setter is XML OR check is xml ，then output XML
                res = dataType == "XML" || res ? req.responseXML : req.responseText;
                if (dataType == "SCRIPT")  res = eval(req.responseText);
                else if (dataType == "JSON")  res = eval("(" + req.responseText + ");");
                if (self._request.status == 200) {
                    if (timer) clearTimeout(timer);
                    if (typeof self.success == "function") self.success.call(this, res);
                }
            }
        }
    }

    function ajax(o) {
        return new _request(o)
    }

    var jsonp = function (url, callback) {
        var callbackName = 'jsonp_callback_' + new Date().getTime();
        P[callbackName] = function (data) {
            delete P[callbackName];
            document.body.removeChild(script);
            callback(data);
        };
        var script = document.createElement('script');
        script.src = url.replace("=?", "=" + "P." + callbackName);
        document.body.appendChild(script);
    }

    P.jsonp = jsonp;
    P.ajax = ajax;
    return{
        ajax:ajax,
        jsonp:jsonp,
        LoaderQueue:LoaderQueue
    }

})
