function Scene1() {

this.vertexShader = `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

this.fragmentShader = `\
uniform float uTime;
in  vec3 vPos;
out vec4 fragColor;
void main() {
   fragColor = vec4(0.);
   for (int i = 0 ; i < 20 ; i++) {
      float x = 8.*(vPos.x+noise(10.6*vec3(float(i))+100.3+.1*uTime));
      float y = 8.*(vPos.y+noise(10.3*vec3(float(i))+200.6+.1*uTime));
      vec3 lightDir = normalize(vec3(sin(uTime),1.,1.));
      float rr = 1. - x*x - y*y;
      if (rr > 0.) {
         float z = sqrt(rr);
         float b = max(0., dot(vec3(x,y,z), lightDir));
         vec3 rgb = vec3(.1,.05,.05) + .8 * vec3(b) * vec3(.2,.5,1.);
         rgb *= 1. + .5 * noise(3. * vec3(x,y,z + .1 * uTime));
         fragColor = vec4(sqrt(rgb), 1.0);
      }
   }
}`;

let startTime = Date.now() / 1000;

this.update = () => {
   setUniform('1f', 'uTime', Date.now() / 1000 - startTime);
}

}

