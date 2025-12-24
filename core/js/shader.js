
let textureShader = `
   vec4 T;
   if (uTextured) {
      T = texture(uSampler, vUV);
      c *= T.rgb;
   }
   fragColor = vec4(c, uTextured ? T.a : 1.);
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
uniform bool uTextured;
uniform sampler2D uSampler;

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
uniform bool uTextured;
uniform sampler2D uSampler;

void main() {
   vec3 L = vec3(.577), N = normalize(vNor);
   float d = dot(L,N), r = 2. * dot(L,N) * N.z - L.z;
   vec3 c = sqrt( uColor * vec3(.1 + max(0.,d)+max(0.,-d)*.5)
                  + pow(max(0., r),20.)
		  + pow(max(0.,-r),20.)*.5 );
   ` + textureShader + `
}`,

};

