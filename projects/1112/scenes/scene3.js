function Scene() {

   this.vertexShader = `#version 300 es
      uniform mat4 uMF, uMI;

      in  vec3 aPos, aNor, aTan;
      in  vec2 aUV;

      out vec3 vPos, vNor, vTan;
      out vec2 vUV;

      void main() {
         vec4 pos = uMF * vec4(aPos, 1.);
         vec4 nor = vec4(aNor, 0.) * uMI;
         vec4 tan = vec4(aTan, 0.) * uMI;
         gl_Position = pos * vec4(1.,1.,-.1,1.);
         vPos = pos.xyz;
         vNor = nor.xyz;
         vTan = tan.xyz;
         vUV  = aUV;
      }
   `;
   this.fragmentShader = `#version 300 es
      precision highp float;
      in  vec3 vPos, vNor, vTan;
      in  vec2 vUV;
      out vec4 fragColor;
      uniform vec3 uColor;
      uniform sampler2D uSampler[2];

      void main() {
         vec3 nor = normalize(vNor);
         vec3 tan = normalize(vTan);

         vec4 B = texture(uSampler[1], vUV);
         vec3 bin = normalize(cross(nor,tan));
         nor = normalize(              nor
	               + (2.*B.r-1.) * tan
	               + (2.*B.g-1.) * bin);

         float c = .1 + max(0., dot(vec3( .5),nor))
                      + max(0., dot(vec3(-.5),nor));

         vec3 L = vec3(.577);
	 vec3 P = vec3(.5,.7,1.),
	      Q = vec3(.6,.2,.1);
         float d = dot(L,nor),
	       r = 2. * dot(L,nor) * nor.z - L.z;
         vec3 diffuse = .1 + P*max(0.,d)
	                   + Q*max(0.,-d);
         vec3 specular = P*pow(max(0., r),60.)
	               + Q*pow(max(0.,-r),60.);

	 vec3 color = uColor * diffuse + specular;

         vec3 T = texture(uSampler[0], vUV).rgb;

         fragColor = vec4(sqrt(color) * T, 1.);
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
      return [ x,y,z, x,y,z, -y,x,0, u,v ];
   });

   let tube = nu => createMesh(nu,2,(u,v) => {
      let theta = Math.PI * 2 * u,
          x = Math.cos(theta),
          y = Math.sin(theta),
          z = 2 * v - 1;
      return [ x,y,z, x,y,0, 0,0,1, u,v ];
   });

   mesh = { triangle_strip: true,
            data: new Float32Array(sphere(40,20)) };

   let isFirstTime = true;

   this.update = () => {
      vertexMap(['aPos',3,'aNor',3,'aTan',3,'aUV',2]);
      if (isFirstTime) {
         setUniform('1iv', 'uSampler', [0,1]);
         addTexture(0, 'mosaic_color.png');
         addTexture(1, 'mosaic_bumps.png');
	 isFirstTime = false;
      }
      let time = Date.now() / 1000;
      drawObj(mesh, mxm(turnY(time/2),
                    mxm(turnX(Math.PI/4),
		        scale(.6,.6,.75))));
   }
}

