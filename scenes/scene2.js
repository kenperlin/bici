function Scene2() {

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
uniform vec3 uP;
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
   return vec4(C * (.1 + .5*max(0., N.x+N.y+N.z) +
                         .5*max(0.,-N.x-N.y-N.z/2.)), 1.);
}
void main() {
   vec3 V = uP;
   vec3 W = normalize(vec3(vPos.xy-uP.xy,-V.z));

   vec3 C = vec3(1.,.85,.75);
   vec4 F = vec4(0.);
   for (int i = 0 ; i <= 3 ; i++) {
      float z = .3 * (2. * float(i) / 3. - 1.);
      for (int j = 0 ; j <= 3 ; j++) {
         float y = .3 * (2. * float(j) / 3. - 1.);
         for (int k = 0 ; k <= 3 ; k++) {
            float x = .3 * (2. * float(k) / 3. - 1.);
            if ( (i==0||i==3)&&(j==0||j==3) ||
                 (i==0||i==3)&&(k==0||k==3) ||
                 (j==0||j==3)&&(k==0||k==3) )
               F = raySphere(V, W, vec4(x,y,z,.1), C, F);
         }
      }
   }
   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now() / 1000;

this.update = viewPoint => {
   setUniform('1f', 'uTime', Date.now() / 1000 - startTime);
   setUniform('3fv', 'uP', viewPoint);
}

}

