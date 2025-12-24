
let textureShader = `
   vec4 T = vec4(1.);
   switch (uTexture) {
   case  0: T = texture(uSampler[ 0], vUV); break;
   case  1: T = texture(uSampler[ 1], vUV); break;
   case  2: T = texture(uSampler[ 2], vUV); break;
   case  3: T = texture(uSampler[ 3], vUV); break;
   case  4: T = texture(uSampler[ 4], vUV); break;
   case  5: T = texture(uSampler[ 5], vUV); break;
   case  6: T = texture(uSampler[ 6], vUV); break;
   case  7: T = texture(uSampler[ 7], vUV); break;
   case  8: T = texture(uSampler[ 8], vUV); break;
   case  9: T = texture(uSampler[ 9], vUV); break;
   case 10: T = texture(uSampler[10], vUV); break;
   case 11: T = texture(uSampler[11], vUV); break;
   case 12: T = texture(uSampler[12], vUV); break;
   case 13: T = texture(uSampler[13], vUV); break;
   case 14: T = texture(uSampler[14], vUV); break;
   case 15: T = texture(uSampler[15], vUV); break;
   }

   // Special case if texture is ascii characters.

   if (uTexture == 15 && min(T.r,min(T.g,T.b)) > .9)
      discard;

   fragColor = vec4(c * T.rgb, T.a);
`;

let Shader = {

defaultVertexShader : `\
#version 300 es
uniform mat4 uMF, uMI;

in  vec3 aPos, aNor;
in  vec2 aUV;
out vec3 vPos, vNor;
out vec2 vUV;

void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-.1,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
   vUV  = aUV;
}`,

defaultFragmentShader : `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
in  vec2 vUV;
out vec4 fragColor;
uniform vec3 uColor;
uniform int uTexture;
uniform sampler2D uSampler[16];

void main() {
   vec3 nor = normalize(vNor);
   vec3 c = sqrt(uColor * (.1 + max(0., dot(vec3( .5),nor))
                              + max(0., dot(vec3(-.5),nor))));
   ` + textureShader + `
}`,

shinyFragmentShader : `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
in  vec2 vUV;
out vec4 fragColor;
uniform vec3 uColor;
uniform int uTexture;
uniform sampler2D uSampler[16];

void main() {
   vec3 L = vec3(.577), N = normalize(vNor);
   float d = dot(L,N), r = 2. * dot(L,N) * N.z - L.z;
   vec3 c = sqrt( uColor * vec3(.1 + max(0.,d)+max(0.,-d)*.5)
                  + pow(max(0., r),20.)
		  + pow(max(0.,-r),20.)*.5 );
   ` + textureShader + `
}`,

};

