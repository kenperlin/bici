var a = #0*vec2(3*x,3*y);
var b = vec3(a,#1*2*time);
var r = x*x + y*y;
r += .5 + .5 * noise(b);
rgb = r*vec3(#2,#3,#4);
if (r > 1) {
   discard;
}
