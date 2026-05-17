var r = x*x + y*y;
r += .5+.5*noise(vec3(2*x,2*y,time));
if (r > 1) { discard; }
rgb = r * vec3(1,.5,.4);

