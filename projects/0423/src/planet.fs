if (x*x+y*y>.85) { discard; }
var dz=sqrt(1.-x*x-y*y);
var s=.3*x+.3*y+.9*dz;
s*=s;
s*=s;
var cR=cos(.2*time);
var sR=sin(.2*time);
var cV=cos(.1*time);
var sV=sin(.1*time);
var P=vec3(cR*x+sR*dz+cV, y,
          -sR*x+cR*dz+sV);
var g=turbulence(P);
var d=1.-1.2*(x*x+y*y);
if (d>0)
   {d=.1+.05*g+.6*(.1+g)*s*s;}
else
   {d=max(0.,d+.1);}
var f=sin(4.*P.x+8.*g+@0)-.2;
if (f > 0.)
   {f=1.;}
else
   {f=1.-f*f*f;}
if (d < .1)
   {f*=(g+5.)/3.;}
rgb=vec3(d*f*f*.85,d*f,d*.7);
