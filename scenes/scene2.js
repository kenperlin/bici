let scene2 = {
vertexShader : `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`,
fragmentShader : `\
uniform float uTime;
in  vec3 vPos;
out vec4 fragColor;
void main() {
   fragColor = vec4(0.);
   for (int i = 0 ; i < 10 ; i++) {
      float x = 8. * vPos.x + 8. * noise(10.6 * vec3(float(i)) + 100.3 + .05 * uTime);
      float y = 8. * vPos.y + 8. * noise(10.3 * vec3(float(i)) + 200.6 + .05 * uTime);
      vec3 lightDir = normalize(vec3(sin(uTime),1.,1.));
      float rr = 4. - x*x - y*y;
      if (rr > 0.) {
         float z = sqrt(rr);
         float b = max(0., dot(vec3(x,y,z), lightDir));
         vec3 rgb = vec3(.8,.05,.05) + .8 * vec3(b) * vec3(.2,.5,1.);
         rgb *= 1. + .5 * noise(3. * vec3(x,y,z + .1 * uTime));
         fragColor = vec4(sqrt(rgb), 1.0);
      }
   }
}`,
init : () => {
   scene2.startTime = Date.now();
},
update : () => {
   setUniform('1f', 'uTime', (Date.now() - scene2.startTime) / 1000);
},
}

