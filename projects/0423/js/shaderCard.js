function ShaderCard(ctx) {
   let canvas = document.createElement('canvas'), shader = '', gl, prog, uTime, startTime;
   canvas.width = canvas.height = 500;
   document.body.appendChild(canvas);
   gl = canvas.getContext("experimental-webgl");

   let noise = `
vec3 s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float t(vec3 i, vec3 u, vec3 a) { return dot(normalize(s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(t(i, u, vec3(0.,0.,0.)), t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(t(i, u, vec3(0.,1.,0.)), t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(t(i, u, vec3(0.,0.,1.)), t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(t(i, u, vec3(0.,1.,1.)), t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;

   this.setShader = text => {
      if (text == shader)
         return;
      shader = text;
      prog = gl.createProgram();
      let addshader = (type, src) => {
         let shader = gl.createShader(type);
         gl.shaderSource(shader, src);
         gl.compileShader(shader);
         gl.attachShader(prog, shader);
      };
      addshader(gl.VERTEX_SHADER, 'attribute vec3 _p;varying float x,y;void main(){gl_Position=vec4(x=_p.x,y=_p.y,0.,1.);}');
      addshader(gl.FRAGMENT_SHADER, `precision highp float;uniform float time;varying float x,y;
` + noise + `
                                     void main(){vec3 rgb;` + shader + `gl_FragColor=vec4(rgb,1.);}`);
      gl.linkProgram(prog);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0,1,1,0,-1,-1,0,1,-1,0]), gl.STATIC_DRAW);
      let _p = gl.getAttribLocation(prog, "_p");
      gl.enableVertexAttribArray(_p);
      gl.vertexAttribPointer(_p, 3, gl.FLOAT, false, 0, 0);
      uTime = gl.getUniformLocation(prog,'time');
      startTime = Date.now() / 1000;
   }

   this.draw = (x,y,w) => {
      let elapsed = Date.now() / 1000 - startTime;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      ctx.drawImage(canvas, x-w/2, y-w/2, w, w);
   }
}

