let noiseCode = `
vec3  _s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float _t(vec3 i, vec3 u, vec3 a) { return dot(normalize(_s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;
let phongCode = `
vec3 phong(vec3 N, vec3 L, vec3 W, vec3 diffuse, vec4 specular) {
   vec3 R = 2. * N * dot(N,L) - L;
   return diffuse      * max(0., dot(N, L)) +
          specular.rgb * pow(max(0.,dot(R,-W)), specular.a);
}
`;
let isImplicit = false;
let intervalID, autodraw = true;
let vertexSize = 6;
let mesh = {
  triangle_strip: true,
  data: new Float32Array([
     -1, 1,0, 0,0,1,
      1, 1,0, 0,0,1,
     -1,-1,0, 0,0,1,
      1,-1,0, 0,0,1,
   ])
};
function gl_start(canvas, scene) {
   setTimeout(function() {
      canvas.gl = canvas.getContext('webgl2');
      canvas.setShaders = function(vertexShader, fragmentShader) {
         gl = this.gl;
	 gl.program = gl.createProgram();
         function addshader(type, src) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS))
               console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
            gl.attachShader(gl.program, shader);
         };

         addshader(gl.VERTEX_SHADER, vertexShader);

	 let i = fragmentShader.indexOf('float') + 6;
         addshader(gl.FRAGMENT_SHADER, fragmentShader.substring(0,i)
	                             + noiseCode
	                             + phongCode
		                     + fragmentShader.substring(i));

         gl.linkProgram(gl.program);
         if (! gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.enable(gl.DEPTH_TEST);
         gl.depthFunc(gl.LEQUAL);
	 vertexMap(['aPos',3,'aNor',3]);
      }
      canvas.setShaders(scene.vertexShader, scene.fragmentShader);
      if (intervalID)
         clearInterval(intervalID);
      intervalID = setInterval(function() {
         animate();
	 if (autodraw)
	    drawMesh(mesh);
      }, 10);
   }, 100);
}

let vertexMap = map => {
   let vertexAttribute = (name, size, position) => {
      let attr = gl.getAttribLocation(gl.program, name);
      gl.enableVertexAttribArray(attr);
      gl.vertexAttribPointer(attr, size, gl.FLOAT, false, vertexSize * 4, position * 4);
   }
   vertexSize = 0;
   for (let n = 0 ; n < map.length ; n += 2)
      vertexSize += map[n+1];
   let index = 0;
   for (let n = 0 ; n < map.length ; n += 2) {
      vertexAttribute(map[n], map[n+1], index);
      index += map[n+1];
   }
}

let drawMesh = mesh => {
   gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
   gl.drawArrays(mesh.triangle_strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
                 0, mesh.data.length / vertexSize);
}

let drawObj = (mesh, matrix, color) => {
   autodraw = false;
   let m = mxm(perspective(0,0,-.5),matrix);
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
}

let animate = () => {}
let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);
