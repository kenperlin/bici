window.game = {

   colors : '#ff0000,#ff8000,#ffff00,#30d030,#0080ff,#a000ff,#e800a0,#ffffff'.split(','),

   superquadric : (t, C, R) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = Math.pow(x*x*x*x + y*y*y*y, 1/4);
      return [C[0] + R * x / r, C[1] + R * y / r];
   },

   regularPolygon : (t, C, R, n, isStar) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = isStar && n * t >> 0 & 1 ? R/2 : R;
      return [C[0] + r * x, C[1] + r * y];
   },

   heart : (t, C, R) => {
      let x = Math.sin(2 * Math.PI * t);
      let y = Math.cos(2 * Math.PI * t);
      let r = R * (1 - Math.pow(2 * (t < .5 ? t : 1-t), .7));
      return [C[0] + 1.25 * r * x, C[1] + .5*R - r * y];
   },

   cross : (C,a,b) => [ [C[0]-a,C[1]-b],[C[0]-b,C[1]-b],[C[0]-b,C[1]-a],
                        [C[0]+b,C[1]-a],[C[0]+b,C[1]-b],[C[0]+a,C[1]-b],
                        [C[0]+a,C[1]+b],[C[0]+b,C[1]+b],[C[0]+b,C[1]+a],
                        [C[0]-b,C[1]+a],[C[0]-b,C[1]+b],[C[0]-a,C[1]+b] ],

   info : str => {
      octx.save();
      octx.fillStyle = 'black';
      octx.font = '24px Helvetica';
      octx.fillText(str, screen.width/2, 30);
      octx.restore();
   },
}

