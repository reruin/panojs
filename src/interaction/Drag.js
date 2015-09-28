P.module('P.interaction.Drag',[
    'P.interaction.Interaction',
    'P.base.events',
    'P.interaction.DragObject',
    'P.base.kinetic'
],function(interaction,events,DragObject,Kinetic){
    function Drag(pano){
        interaction.call(this,pano);

    }


    P.inherit(Drag , interaction ,{

        CLASS_NAME: "P.interaction.Drag",

        mixin: events,

        controlMode : 1,

        activate: function () {
            this._dragObj = new DragObject(this._pano._dragMask, this);
            //console.log(this._dragObj)
            this.kinetic = new Kinetic();
            this._pano.kinetic = this.kinetic;

            this._dragObj.on({
                'dragstart': this._onDragStart,
                'dragging': this._onDragging,
                'dragend': this._onDragEnd
            }, this).activate();
        },

        _onDragStart_1 : function(){
            this._pano.animation.clear();

            this._pano._scene._loaderQueue.clear();

            this._pano.kinetic.begin();


        },

        _onDragStart: function() {
            //document.title = "dragstart";
            this.controlMode = this._pano.options.controlMode;

            this._pano.animation.clear();

            this._pano._scene._loaderQueue.clear();

            //this._pano.frameSnapshot();
            this._pano.kinetic.begin();
            //console.log(this._pano.timeline.fn)

            var pov = this._pano.getPov();
            this._ori = {x: pov.heading, y: pov.pitch };

            this._ori_pov = this._pano._camera.unproject( this._dragObj._startPoint ).toSpherical(true);
            this.lastp = this._dragObj._startPoint;
            //极点在视野内
            this.pole_s = this._pano._camera._projectSphere({x: pov.heading, y: 89.99});
            this.pole_n = this._pano._camera._projectSphere({x: pov.heading, y: -89.99});

            //如果startpoint 在 极圈内，跟随
            //this.follow = this._ori_pov.pitch > 80;
            this._opposite = (this.pole_s != undefined )
            || (this.pole_n != undefined );

            //P.logger("event : dragstart( on pano )");

            this.kinetic.begin({x: pov.heading, y: pov.pitch});
            this._lastnpov = this._ori_pov.x;
        },
        deactivate: function () {
            this._draggable.deactivate();
        },

        _lastnpov:0,
        _onDragging: function () {

            var dx,dy;
            if(this.controlMode == 1)
            {
                //console.log()
                var p = this._dragObj._newPoint.subtract(this.lastp);
                //console.log(p)
                var dpov = this._pano._camera.getPovFor2D(p);

                //dpov.pitch -= this._ori.y;
                //dpov.heading -= this._ori.x;
                this.lastp = this._dragObj._newPoint;
                //console.log(dpov)
                this._pano.setPov(dpov , true);
            }else if(this.controlMode == 2)
            {
                var pov = this._pano.getPov();
                //标准值 [0,360]
                var n_pov = this._pano._camera.unproject( this._dragObj._newPoint  ).toSpherical(true);

                this._lastnpov = n_pov.x;
                dy = this._ori_pov.y - n_pov.y;
                dx = this._ori_pov.x - n_pov.x;
                if(Math.abs(dx)>270){
                    if(dx > 0) dx -= 360;
                    else dx+= 360;
                }

                //更改 可见极点时的操作方式
                if((this.pole_s && this.pole_s.y < this._dragObj._startPoint.y) || (this.pole_n && this.pole_n.y > this._dragObj._startPoint.y)){
                    //var f = this._pano._camera._focus;
                    dy = -(this._dragObj._newPoint.y - this.lastp.y)*this._pano._camera._bfov/this._pano.viewHeight;
                    dx = -(this._dragObj._newPoint.x - this.lastp.x)*this._pano._camera._bfov/this._pano.viewWidth;

                    this.lastp = this._dragObj._newPoint;
                }

                if(isNaN(dx) == false && isNaN(dy) == false)
                {
                    var pov = {heading: dx  , pitch: dy};
                    //console.log(this._ori_pov.x +","+ n_pov.x +","+dx)
                    //不要updateTiles
                    this._pano.setPov(pov, true , false);
                    //P.Tweener
                }

                //this._pano._panTo(this._ori_pov , this._dragObj._newPoint)

            }else if(this.controlMode == 0){

            }

            var p = this._pano.getPov();

            this._pano.trigger('move').trigger('pov_changed', p);

            this.kinetic.update( p.heading , p.pitch );


        },
        _onDragEnd: function (e) {
            var pov = this._pano.getPov();
            //alert("dragend")
            //状态快照
            //this._pano.frameSnapshot();
            var m = this.kinetic.end();

            if (m) {
                //传入mouseup 的位置,作为pan动作的起始位置, 最近一次的位移作为 初始位移，由于 pan 衰减的 easing 函数,返回值不在 [0,1],因而 缓动 停止时的 位置 有可能远于 mousedown 时的位置
                var distance = this.kinetic.getDistance(),
                    angle = this.kinetic.getAngle(),
                    dx = distance * Math.cos(angle),
                    dy = distance * Math.sin(angle);
                // distace < 0
                if(this.animate)
                    this._pano.animation.remove(this.animate);

                this.animate =  this._pano.animation.add( this.kinetic.pan([pov.heading,pov.pitch] , [pov.heading + dx, pov.pitch + dy] ) );

            }else
            {
                this._pano.trigger('move').trigger('pov_changed', pov);
                this._pano.render(true);
            }

        }
    })

    return Drag;
});