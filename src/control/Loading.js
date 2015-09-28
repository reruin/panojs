/**
 * 控制基类
 */
P.module('P.control.Loading',['P.control.Control'],function(Control){
    function Loading(opts){
        P.setOptions(this, opts);
        this._container = P.creat('div',null ,'pano-loading',null,'height:3px;background:#67CF22;top:0;left:0;width:0%;transition:all 0.5s;-webkit-transition:all 1s;');
    }
    P.inherit(Loading , Control , {
        onAdd : function(){
            this._pano.addEventListener('load_tiles' ,this.onProcess ,this);
        }
        ,
        onProcess : function(evt){
            var p = (100 * evt.loaded / evt.total) + '%';
            this._container.style.width = p;

            if(evt.loaded == evt.total) this.hide();
            else{
                this.show();
            }
        }
        ,
        show : function(){
            this._container.style.opacity = '1';
        }
        ,
        hide : function(){
            this._container.style.opacity = '0';

        }
    })
    return Loading;
})