function Scene() {

   this.vertexShader = `#version 300 es
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
      }
   `;
   this.fragmentShader = `#version 300 es
      precision highp float;
      in  vec3 vPos, vNor;
      in  vec2 vUV;
      out vec4 fragColor;
      uniform vec3 uColor;
      uniform sampler2D uSampler[2];

      void main() {
         vec3 nor = normalize(vNor);
         float c = .1 + max(0., dot(vec3( .5),nor))
                      + max(0., dot(vec3(-.5),nor));
         vec4 T = texture(uSampler[0], vUV);

	 // TRANSPARENT TEXTURE => TRANSPARENT PIXEL

         fragColor = vec4(sqrt(c)*uColor*T.rgb, T.a);
      }
   `;

   let createMesh = (nu, nv, p) => {
      let mesh = [];
      for (let j = nv ; j > 0 ; j--) {
         for (let i = 0 ; i <= nu ; i++)
            mesh.push(p(i/nu,j/nv),p(i/nu,j/nv-1/nv));
         mesh.push(p(1,j/nv-1/nv),p(0,j/nv-1/nv));
      }
      return mesh.flat();
   }

   let square=(nu=2,nv=2,f)=>createMesh(nu,nv,(u,v)=>{
      return [ 2*u-1,2*v-1,f?f(u,v):0, 0,0,1, u,v ];
   });

   mesh = { triangle_strip: true,
            data: new Float32Array(square()) };

   let isFirstTime = true;

   this.update = () => {
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA,
                   gl.ONE_MINUS_SRC_ALPHA);

      if (isFirstTime) {
         addTexture(0, 'fish.png');
         setUniform('1iv', 'uSampler', [0,1]);
	 isFirstTime = false;
      }
      let time = Date.now() / 1000;
      vertexMap(['aPos', 3, 'aNor', 3, 'aUV', 2]);

      // ARRAY OF CONTINUALLY MOVING FISH POSITIONS

      let P = [];
      for (let n = 0 ; n < 10 ; n++) {
         let a = 1.5, b = n + .5;
         P.push({n:n, p:[a*noise(100.5,b,time/4.1),
                         a*noise(300.5,b,time/4.3),
                           noise(500.5,b,time/4.5)]});
      }

      // SORT THE FISH FROM BACK TO FRONT

      P.sort((a,b) => a.p[2] - b.p[2]);

      // THEN DISPLAY THEM IN BACK TO FRONT ORDER

      for (let i = 0 ; i < P.length ; i++) {
         let n = P[i].n;
         drawObj(mesh, mxm(move(P[i].p), scale(.15)),

            // TRICK TO CREATE VARIED COLORS

	    [s(n)*.5+.5, s(2*n)*.5+.5, s(3*n)*.5+.5]);
      }
   }
}

