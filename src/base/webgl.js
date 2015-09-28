;(function(){
	var gl = null;
	var webgl = window.webgl = {
		init : function(canvas , cfg){
            cfg = cfg || {};

			var g = canvas.getContext("webgl",cfg)
			|| canvas.getContext("experimental-webgl",cfg)
			|| canvas.getContext("webkit-3d",cfg)
			|| canvas.getContext("moz-webgl",cfg);
            g.clearColor(0.0, 0.0, 0.0, 0.0);
			//document.body.appendChild(canvas);
			//alert(g)
			//alert(canvas.getContext("webgl"));
			this.activate(g);
			gl.vs = gl.createShader(gl.VERTEX_SHADER);
			gl.fs = gl.createShader(gl.FRAGMENT_SHADER);
			gl.program = gl.createProgram();
			gl.__varObj = {};
			return g;
		},

		//激活当前 webgl环境
		activate : function(g)
		{
			webgl.gl = gl = g; return this;
		},

		elementBuffer : function(d){
			return new Buffer("ELEMENT_ARRAY_BUFFER" , d);
		},

		arrayBuffer : function(d){
			return new Buffer("ARRAY_BUFFER" , d);
		},

		texture2d : function(a,b,c,d){
			return new Texture2D(a , b, c, d);
		},

		creat:function(vs , fs){
			gl.shaderSource(gl.vs, vs);
			gl.shaderSource(gl.fs, fs);

			gl.compileShader(gl.vs);
			gl.compileShader(gl.fs);
			gl._source = [vs,fs];
			return this;
		},

		use : function(){

			gl.attachShader(gl.program, gl.vs);
			gl.attachShader(gl.program, gl.fs);

			gl.linkProgram(gl.program);
			this._an(gl._source[0] + gl._source[1])
			gl.useProgram(gl.program);
			return this;
		},

		_an : function(source){

			source.replace(/\b(attribute|uniform)\b[^;]+?(\w+)\s+(\w+)\s*;/g , function($0,$1,$2,$3){
				var loc, type, size=$2.match(/\d+$|$/g,"")[0]|0||1 , handler , t = 1 , ismat;
				if($1=="attribute"){
					loc = gl.getAttribLocation(gl.program,$3);

					if(loc<0) return;
					gl.enableVertexAttribArray(loc);

					t = 0;

				}else{
					loc = gl.getUniformLocation(gl.program,$3);
					if(!loc) return;
					type=/int|sampler/.test($2)?"i":"f";
                    ismat = /^mat/.test($2);
                    //if(type == "i") alert($2)
				};
				gl.__varObj[$3] = {
					size : size ,
					loc : loc,
					type : t,
					data : null,
					ismat : ismat,
					field : ismat ? "uniformMatrix"+size+"fv" : "uniform"+size+type+"v"
				}
			})
		},

		set : function(o , v){
			if(arguments.length == 1)
			{
				if(typeof(o) == "object")
				{
					for(var i in o)
						this.set(i , o[i]);
				}else if(typeof(o) == "string")
				{
					return gl.__varObj[o].data;
				}
			}else if(arguments.length == 2)
			{
				if(gl.__varObj[o])
				{
					//保存数据
					gl.__varObj[o].data = v;

					var t = gl.__varObj[o];

					// attr
					if(t.type == 0)
					{
						//缓冲托管
						if(Object.prototype.toString.call(v) === '[object Array]' || Object.prototype.toString.call(v) === '[object Float32Array]')
						{
							v = webgl[gl.__varObj[o].type==0 ? "arrayBuffer" : "elementBuffer"](v);
							gl.__varObj[o].buff = v;
						}else{
							v.bind();
						}

						gl.vertexAttribPointer(gl.__varObj[o].loc,gl.__varObj[o].size,gl.FLOAT,false,0,0)
					}else
					{
						//
                        //console.log(t.loc)
						if(t.ismat) gl[t.field](t.loc,false,new Float32Array(v));
						else gl[t.field](t.loc, v instanceof Array?v:[v]);
					}


				}

			}

			return this;
		},

		get : function(o){
			return gl.__varObj[o] ?
				gl.__varObj[o] : null;
		},

        //清除绘制出的指定数据
        clear : function(){
            var n,v=0;
            for(var i=arguments.length;n=arguments[--i];) v |= gl[n+"_BUFFER_BIT"];
            v && gl.clear(v);
            return this;
        },

        color : function(v){
            if(Object.prototype.toString.call(v) !== '[object Array]')
            {
                v = Array.prototype.slice.call(arguments)
            }

            gl.clearColor.apply(gl , v);
            return this;
        },

		draw : function(obj , type){
			if(typeof(obj) == "number"){
				//gl.drawElements( gl.TRIANGLES, obj, gl.UNSIGNED_SHORT,0);
				//return this;
			}
			type = gl[type || "TRIANGLES"];

			if(obj._buffer){
				//console.log("draws")
				gl.drawElements( type, obj.bind().data().length, gl.UNSIGNED_SHORT,0)
			}else
			{
				//图元，顶点数组开始下标，顶点数量
				gl.drawArrays(type,0,obj);
			}
			return this;
		},
		
		drawElements : function(type , l){
			
			gl.drawElements(gl[type], l, gl.UNSIGNED_SHORT, 0);
			return this;
		},

        viewport : function(w , h){
            gl.viewport(0, 0, w, h);
        },

        setting : function(o){
            var fn = {DEPTH_TEST:"depthFunc",BLEND:"blendFunc",CULL_FACE:null};
            for(var i in o)
            {
                if(o[i] === null) gl.disable(gl[i]);
                else {
                    gl.enable(gl[i]);
                    //一堆 static...
                    fn[i] && gl[ fn[i] ]( gl[o[i]] );
                }

            }
            return this;
        },

		isBuffer:function(v){
			return v instanceof Buffer;
		},
		
		bindTexture : function(v){
            //P.logger("==>"+typeof(tex))
			v.bind();
            return this;
			//gl.bindTexture(gl.TEXTURE_2D, program.currentNodes[i].texture);
		},
		
		unbindTexture:function(v){
			v.isbind() && gl.bindTexture(gl.TEXTURE_2D,null);
			return this;
		}

	};
	
	function Buffer( type , data){
		this.type = type || "ARRAY_BUFFER";
		this._buffer = gl.createBuffer();
		return data ? this.data(data) : this;
	}
	
	Buffer.prototype = {
		
		bind : function(){
			gl.bindBuffer(gl[this.type],this._buffer);
			return this;
		},
		
		isbind : function(){
			return gl.getParameter(gl[type+"_BINDING"]) == this._buff;
		},
		
		unbind : function(){
			this.isbind() && gl.bindBuffer(gl[this.type],null);
			return this;
		},
		
		data : function(v){
			if(v === undefined) return this._data;
			this.bind();
			this._data = v;
			this._rawdata = new (this.type=="ARRAY_BUFFER"?Float32Array:Uint16Array)(v);
			gl.bufferData( gl[this.type], this._rawdata ,gl.STATIC_DRAW );
			return this;
		},
		
		dispose : function(){ gl.deleteBuffer(this._buff); this._buff = null; return this; }
	};
	
	function Texture2D( data,color,w,h )
	{
		this._data = gl.createTexture();
		this._index = 1;
		if(arguments.length)
			this.data.apply(this, Array.prototype.slice.call(arguments) )
			.setting({
				TEXTURE_MIN_FILTER:"LINEAR"
				,TEXTURE_MAG_FILTER:"LINEAR"
				,TEXTURE_WRAP_S:"CLAMP_TO_EDGE"
				,TEXTURE_WRAP_T:"CLAMP_TO_EDGE"
			});
        return this;
	}
	
	Texture2D.prototype = {
		//绑定tex 序号，最大20个
		bind:function(i){
            if(i == undefined) this._index = i;

			//gl.activeTexture(gl["TEXTURE" + this._index]);
			gl.bindTexture(gl.TEXTURE_2D,this._data);
			return this;
		},
		  
		unbind:function(){
			this.isbind() && gl.bindTexture(gl.TEXTURE_2D,null);
			return this;
		},
		  
		isbind:function(){
           // P.logger(this._index+"<===")
			//gl.activeTexture(this._index);
			return this._index == gl.getParameter(gl.TEXTURE_BINDING_2D);
		},
		  
		data : function(obj,color,width,height){
			this.bind(this._index); color = gl[color];
            //this.obj = obj
            var argus = obj instanceof HTMLElement ?
                    [gl.TEXTURE_2D,0,color,color,gl.UNSIGNED_BYTE,obj] :
                    [gl.TEXTURE_2D,0,color,width,height,0,color,gl.UNSIGNED_BYTE,obj ? new Uint8Array(obj):null];
			gl.texImage2D.apply( gl , argus);
			return this;
		},


		setting : function(o , v){
			this.bind(this._index);
			if(arguments.length == 2) gl.texParameteri(gl.TEXTURE_2D,gl[o],gl[v]);
			else{
				for(var i in o)
					gl.texParameteri(gl.TEXTURE_2D,gl[i],gl[o[i]]);
			}
			return this;
		},
		
		//获取pixel 值，返回 unit8array
		read : function(x, y, w, h){
			var w = w || 1,h = h || 1,
				r = new Uint8Array(w*h*4);
			this.bind(this._index);
			gl.readPixels(x,y,w,h,gl.RGBA,gl.UNSIGNED_BYTE,r)
			return r;
		},

        //生成Mipmap方式的贴图
		generate:function(){
			this.bind(this._index);
			gl.generateMipmap(gl.TEXTURE_2D);
			return this;
		},
		
		dispose : function(){
			gl.deleteTexture(this._data);
			return this;
		}
	}
}());