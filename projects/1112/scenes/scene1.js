function Scene() {

   let addTexture = (index, src) => {
      let image = new Image();
      image.onload = () => {
         gl.activeTexture(gl.TEXTURE0 + index);
         gl.bindTexture(gl.TEXTURE_2D,
	                gl.createTexture());
         gl.texImage2D(gl.TEXTURE_2D,
	               0,
		       gl.RGBA,
		       gl.RGBA,
	               gl.UNSIGNED_BYTE,
		       image);
         gl.texParameteri(gl.TEXTURE_2D,
	                  gl.TEXTURE_MAG_FILTER,
	                  gl.LINEAR_MIPMAP_NEAREST);
         gl.texParameteri(gl.TEXTURE_2D,
	                  gl.TEXTURE_MIN_FILTER,
	                  gl.LINEAR_MIPMAP_NEAREST);
         gl.generateMipmap(gl.TEXTURE_2D);
         gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);

      }
      image.src = 'projects/'+project+'/images/'+src;
   }

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
         vec3 T = texture(uSampler[0], vUV).rgb;
         fragColor = vec4(sqrt(c) * uColor * T, 1.);
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

   let sphere = (nu,nv) => createMesh(nu,nv,(u,v) => {
      let theta = Math.PI * 2 * u,
          phi   = Math.PI * (v - .5),
          x = Math.cos(phi) * Math.cos(theta),
          y = Math.cos(phi) * Math.sin(theta),
          z = Math.sin(phi);
      return [ x,y,z, x,y,z, u,v ];
   });

   mesh = { triangle_strip: true,
            data: new Float32Array(sphere(40,20)) };

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
                    mxm(turnX(Math.PI/2),
		        scale(.5))));
   }
}

