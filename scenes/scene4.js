function Scene4() {

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
uniform vec3 uViewPoint;
in  vec3 vPos;
out vec4 fragColor;

vec4 raySphere(vec3 V, vec3 W, vec4 S, vec3 C, vec4 F) {
   V -= S.xyz;
   float b = dot(V, W);
   float d = b * b - dot(V, V) + S.w * S.w;
   if (d < 0.)
      return F;
   float t = -b - sqrt(d);
   float z = V.z + S.z + t * W.z;
   if (z < F.w)
      return F;
   vec3 N = (((V + S.xyz) + t * W) - S.xyz) / S.w;
   return vec4(C * (.1 + .5*max(0., N.x+N.y+N.z) +
                         .5*max(0.,-N.x-N.y-N.z/2.)), z);
}
vec4 rayScene(vec3 V, vec3 W) {
   vec4 F = vec4(0.,0.,0.,-1000.);
   F = raySphere(V,W,vec4(-.3,0.,0.,.4),vec3(1.,1.,1.),F);
   F = raySphere(V,W,vec4( .3,0.,.3,.4),vec3(1.,1.,1.),F);
   return F;
}
void main() {
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   vec4 F = rayScene(V, W);
   fragColor = vec4(sqrt(F.rgb), F.w == -1000. ? 0. : 1.);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   setUniform('1f', 'uTime', Date.now()/1000 - startTime);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

