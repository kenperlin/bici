var a = (.5+@0)*vec2(3*x,3*y);
var b = vec3(a,(.5+@1)*time);
var r = x * x + y * y;
r += .5 + .5 * noise(b);
rgb = r * (.7+vec3(@2,@3,@4));
if (r > 1) {
   discard;
}

