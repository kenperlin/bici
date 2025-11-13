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
         fragColor = vec4(sqrt(c)*uColor*T.rgb, 1.);
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

   let tube = nu => createMesh(nu,2,(u,v) => {
      let theta = Math.PI * 2 * u,
          x = Math.cos(theta),
          y = Math.sin(theta),
          z = 2 * v - 1;
      return [ x,y,z, x,y,0, u,v ];
   });

   mesh = { triangle_strip: true,
            data: new Float32Array(tube(40)) };

   let isFirstTime = true;

   this.update = () => {
      if (isFirstTime) {
         addTexture(0, 'brick.png');
         setUniform('1iv', 'uSampler', [0,1]);
	 isFirstTime = false;
      }
      let time = Date.now() / 1000;
      vertexMap(['aPos', 3, 'aNor', 3, 'aUV', 2]);
      drawObj(mesh, mxm(turnY(time/2),
                    mxm(turnX(Math.PI/4),
		        scale(.3,.3,.4))));
   }
}

