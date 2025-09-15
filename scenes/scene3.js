function Scene3() {

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
   vec3 N = (((V + S.xyz) + t * W) - S.xyz) / S.w;
   return vec4(C * (.1 + .5*max(0., N.x+N.y+N.z)
                       + .5*max(0.,-N.x-N.y-N.z/2.)), 1.);
}
void main() {
   fragColor = vec4(0.);
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   fragColor = raySphere(V, W, vec4(0.,0.,0.,.5),
                               vec3(1.,1.,1.), fragColor);
   fragColor = vec4(sqrt(fragColor.rgb), fragColor.a);
}`;

let startTime = Date.now()/1000;

this.update = viewPoint => {
   setUniform('1f', 'uTime', Date.now()/1000 - startTime);
   setUniform('3fv', 'uViewPoint', viewPoint);
}

}

