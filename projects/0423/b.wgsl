var r = x*x + y*y;
var v = vec3(2*x,2*y,time);
r += .5 + .5 * noise(v);
rgb = r * vec3(1,.5,.4);
if (r > 1) {
   discard;
}
