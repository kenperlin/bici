
let Shader = {

defaultVertexShader : `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-.1,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`,

defaultFragmentShader : `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;
uniform vec3 uColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3( .5),nor))
                + max(0., dot(vec3(-.5),nor));
   fragColor = vec4(c * uColor, 1.);
}`,

};

