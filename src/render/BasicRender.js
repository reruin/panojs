
 P.module('P.render.BasicRender',[],function(){
    function BasicRender(pano){
        this._pano = pano;
        this.prefix = P.prefix.css;
    }

     BasicRender.prototype = {

         _nextFrame:false,

         render: function () {
             if(this._nextFrame == true) return;
             this._nextFrame = true;
             P.requestAnimationFrame(P.bind(this._invalidate , this));
         },

         _update : function(){},

         _invalidate : function(){
             //this._pano._scene._checkTexture();
             var renderlist = this._pano._scene._tiles;

             var size = this._pano._scene.tilesize;
             var f = this._pano._camera._focus;
             var h = this._pano.getViewHeight();
             var ww = this._pano.viewWidth * 0.5;
             var wh = this._pano.viewHeight * 0.5;



             var scale = this._pano._camera._focus / this._pano._scene.tilesize;

             var size_r = size * scale;//size * (1 + scale - (1 << this._pano.getDeep())) * ( 1 << this._pano.getDeep());

             var deep = this._pano.getDeep();



             var tx = size * 4 * scale * this._pano.getHeading(false) / 360;

             var ty = size * 1 * scale * ( this._pano.getPitch()) /90;

             var tp = Math.floor(this._pano.getHeading(false) / 360);

             var tp_m = this._pano.getHeading(false) / 360 % 1;

             var flag = tp<0 ? (tp_m > -0.5 && tp_m <0.5) : tp_m>0.5;

             //console.log(scale)
             this._pano._viewport.style["left"] = Math.floor(ww - tx)+"px";
             //console.log(Math.floor(ww-tx))
             this._pano._viewport.style["top"] = Math.floor((wh - size_r*.5)-ty)+"px";

             for(var i in renderlist)
             {

                 var t = renderlist[i];

                 var size_d , scale_d;
                 //renderlist[i].obj.style[pre] = this.getTransform( renderlist[i].transform );
                 //console.log(scale_d+"==<")
                 if(t.z<0){
                     // this is preview
                     // var tox = t.x * 4* scale * size
                     //if(t.x == 0)


                     var u =  scale * size ;
                     // 不能在此处 floor 否则会

                     renderlist[i].obj.style["top"] =  t.y*u + "px";

                     renderlist[i].obj.width = Math.ceil(u) * 4;

                     renderlist[i].obj.height = Math.ceil(u);


                     //renderlist[i].obj.style["left"] = t.x*(scale * size)+"px";
                     //[0.5,1]

                     if(flag) {
                         if (t.x == 0) {
                             renderlist[i].obj.style["left"] = tp * u * 4 + "px";

                         }
                         if (t.x == -1) {
                             renderlist[i].obj.style["left"] = (tp + 1) * u * 4 + "px";
                         }
                     }else
                     {
                         if (t.x == 0) {
                             renderlist[i].obj.style["left"] = (tp-1) * u * 4 + "px";

                         }
                         if (t.x == -1) {
                             renderlist[i].obj.style["left"] = (tp) * u * 4 + "px";
                         }
                     }

                     //console.log("==>"+tp)

                 }else
                 {
                     //级别 z 需要的scale
                     scale_d = scale / (1<<t.z);
                     size_d = size * scale_d;
                     //size_d = size_r;
                     //console.log(t.z);
                     renderlist[i].obj.style["top"] = Math.floor(t.y*size_d)+"px";
                     renderlist[i].obj.style["left"] = Math.floor(t.x*size_d)+"px";

                     renderlist[i].obj.width = renderlist[i].obj.height = Math.ceil(size_d);//+"px";
                 }
             }
             //console.log("==>"+size_r)


             this._nextFrame = false;
         }
    }

    return BasicRender;
})