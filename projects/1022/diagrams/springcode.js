function Diagram() {
   this.update = ctx => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0,0,this.width,this.height);
      ctx.strokeStyle = 'black';
      ctx.font = '22px Courier';

this.text('// SPRING                         ', [0, .9]);
this.text('                                  ', [0, .8]);
this.text('function Spring() {               ', [0, .7]);
this.text('   this.getPosition = () => P;    ', [0, .6]);
this.text('   this.setDamping  = d  => D = d;', [0, .5]);
this.text('   this.setForce    = f  => F = f;', [0, .4]);
this.text('   this.setMass     = m  => M = m;', [0, .3]);
this.text('   this.update = e => {           ', [0, .2]);
this.text('      V += (F - P) / M * e;       ', [0, .1]);
this.text('      P  = (P + V) * (1 - D * e); ', [0, .0]);
this.text('   }                              ', [0,-.1]);
this.text('   let D=1, F=0, M=1, P=0, V=0;   ', [0,-.2]);
this.text('}                                 ', [0,-.3]);

   }
}

