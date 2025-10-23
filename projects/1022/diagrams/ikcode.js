function Diagram() {
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';
      ctx.font = '22px Courier';

this.text('// IMPLEMENTATION OF 2-LINK IK      ', [0, .9]);
this.text('                                    ', [0, .8]);
this.text('let ik = (A,a,b,C,aim) => {         ', [0, .7]);
this.text('   C = subtract(C, A);              ', [0, .6]);
this.text('   let cc = dot(C,C),               ', [0, .5]);
this.text('       x = (1+(a*a-b*b)/cc)/2,      ', [0, .4]);
this.text('       c = dot(C,aim)/cc;           ', [0, .3]);
this.text('   for (let i = 0 ; i < 3 ; i++)    ', [0, .2]);
this.text('      D[i] = aim[i] - c * C[i];     ', [0, .1]);
this.text('   let y = Math.max(0,a*a - cc*x*x);', [0, .0]);
this.text('   y = Math.sqrt(y / dot(D,D));     ', [0,-.1]);
this.text('   for (let i = 0 ; i < 3 ; i++)    ', [0,-.2]);
this.text('      B[i] = A[i] + x*C[i] + y*D[i];', [0,-.3]);
this.text('   return B;                        ', [0,-.4]);
this.text('}                                   ', [0,-.5]);

   }
}

