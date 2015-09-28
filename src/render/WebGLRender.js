P.module('P.render.WebGLRender',[],function(){
    function webglRender(view){
        this.view = view;
    }

    webglRender.prototype = {

        _indraw : false ,


        render : function(){
            if(webgl.gl == undefined) return;

            this.multiresDraw();

        },

        _update : function(){},


        multiresDraw : function(v) {
            var scene = this.view._scene;
            // 设置 投影矩阵 视图矩阵
            webgl.set({
                "u_persp" : this.view._camera.getProjectionMatrix()
                ,"u_view" : this.view._camera.getViewMatrix()
            })


            var renderables = scene._tiles;

            if (!this._indraw) {
                this._indraw = true;
                for ( var i in renderables ) {
                    webgl.set({
                        "a_vp" : scene.data.vertBuffer.data( renderables[i].vertices )
                        ,"a_tp" :  scene.data.texBuffer
                        //,"a_alpha":0.5
                    })
                        .bindTexture(renderables[i].texture)
                        .draw(scene.data.indexBuffer);
                }
                this._indraw = false;

            }

        }
    }

    return webglRender;
})