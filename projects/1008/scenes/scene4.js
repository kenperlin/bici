// PARAMETRIC OPEN TUBE
function Scene() {

//gotoFigure('strips');

let tube = n => {
   let V = [];
   for (let i = 0 ; i <= n ; i++) {
      let theta = 2 * Math.PI * i / n
      let c = Math.cos(theta);
      let s = Math.sin(theta);
      V.push(c,s,-1, c,s,0);
      V.push(c,s, 1, c,s,0);
   }
   return V;
}

let disk = n => {
   let V = [];
   for (let i = 0 ; i <= n ; i++) {
      let theta = 2 * Math.PI * i / n
      let c = Math.cos(theta);
      let s = Math.sin(theta);
      V.push(c,s, 0, 0,0,1);
      V.push(0,0, 0, 0,0,1);
   }
   return V;
}

mesh = {
  triangle_strip: true,
  data: new Float32Array(tube(6)),
};

this.vertexShader = `\
#version 300 es
uniform mat4 uMF, uMI;
in  vec3 aPos, aNor;
out vec3 vPos, vNor;
void main() {
   vec4 pos = uMF * vec4(aPos, 1.);
   vec4 nor = vec4(aNor, 0.) * uMI;
   gl_Position = pos * vec4(1.,1.,-1.,1.);
   vPos = pos.xyz;
   vNor = nor.xyz;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
in  vec3 vPos, vNor;
out vec4 fragColor;

void main() {
   vec3 nor = normalize(vNor);
   float c = .1 + max(0., dot(vec3(.5),nor));
   fragColor = vec4(c,c,c, 1.);
}`;

let startTime = Date.now()/1000;

this.update = () => {
   let time = Date.now() / 1000 - startTime;
   let mf = mxm(perspective(0,0,-.5),
            mxm(turnX(time),
            mxm(turnY(time),
	        scale(.3,.3,.15))));
   let mi = inverse(mf);
   setUniform('Matrix4fv', 'uMF', false, mf);
   setUniform('Matrix4fv', 'uMI', false, mi);
}

}
