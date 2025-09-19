function Diagram() {
   let c = {x:0,y:0};
   this.mouseDrag = (x,y) => c = {x:x,y:y};
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.fillStyle = 'black';
      let r = this.sp(.1);
      ctx.fillRect(this.xp(c.x)-r,this.yp(c.y)-r,2*r,2*r);
   }
}

