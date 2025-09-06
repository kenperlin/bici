function gl_start(canvas, vertexShader, fragmentShader) {
   fragmentShader = `#version 300 es
   precision highp float;
   vec3 s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
   float t(vec3 i, vec3 u, vec3 a) { return dot(normalize(s(i + a)), u - a); }
   float noise(vec3 p) {
      vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
      return mix(mix(mix(t(i, u, vec3(0.,0.,0.)), t(i, u, vec3(1.,0.,0.)), v.x),
                     mix(t(i, u, vec3(0.,1.,0.)), t(i, u, vec3(1.,1.,0.)), v.x), v.y),
                 mix(mix(t(i, u, vec3(0.,0.,1.)), t(i, u, vec3(1.,0.,1.)), v.x),
                     mix(t(i, u, vec3(0.,1.,1.)), t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
   }` + fragmentShader;
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
         addshader(gl.FRAGMENT_SHADER, fragmentShader);
         gl.linkProgram(gl.program);
         if (! gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0,1,1,0,-1,-1,0,1,-1,0]), gl.STATIC_DRAW);
         let aPos = gl.getAttribLocation(gl.program, 'aPos');
         gl.enableVertexAttribArray(aPos);
         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      }
      canvas.setShaders(vertexShader, fragmentShader);
      setInterval(function() {
         animate(gl);
         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }, 30);
   }, 100);
}
let animate = () => {}
let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);
