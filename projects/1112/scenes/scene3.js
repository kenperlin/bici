function Scene() {

   _.x = _.x ?? 0;
   _.y = _.y ?? 0;

   let mx, my;
   this.onDown = (x,y) => { mx = x; my = y; }
   this.onDrag = (x,y) => { _.x += x - mx; mx = x;
                            _.y -= y - my; my = y; }

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
         vTan = tan.xyz; // NEED TANGENT VECTOR!
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
	 vec3 Key  = vec3(.5,.7,1.),
	      Fill = vec3(.6,.2,.1);
         float d = dot(L,nor), r = 2.*d*nor.z - L.z;
         vec3 diffuse = .2 + .5 * Key  * max(0., d)
	                   + .5 * Fill * max(0.,-d);
         vec3 specular = Key  * pow(max(0., r),20.)
	               + Fill * pow(max(0.,-r),20.);

	 vec3 color = uColor * diffuse + specular;

         vec4 T = texture(uSampler[0], vUV);

         fragColor = vec4(sqrt(color) * T.rgb, 1.);
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

      // INCLUDE DIRECTION OF TANGENT TO SURFACE

      return [ x,y,z, x,y,z, -y,x,0, u,v ];
   });

   let tube = nu => createMesh(nu,2,(u,v) => {
      let theta = Math.PI * 2 * u,
          x = Math.cos(theta),
          y = Math.sin(theta),
          z = 2 * v - 1;
      return [ x,y,z, x,y,0, -y,x,0, u,v ];
   });

   mesh = { triangle_strip: true,
            data: new Float32Array(sphere(40,20)) };

   let src = 'mosaic';
// let src = 'rocks;
// let src = 'polygons;
// let src = 'wood;

   addTexture(0, src+'_color.png'); // LOAD TEXTURE
   addTexture(1, src+'_bumps.png'); // LOAD BUMP MAP

   this.update = () => {

      // VERTEX ATTRIBUTES: POSITION,NORMAL,TANGENT,UV

      vertexMap(['aPos',3,'aNor',3,'aTan',3,'aUV',2]);

      // 2 SAMPLERS: ONE FOR TEXTURE, ONE FOR BUMP MAP

      setUniform('1iv', 'uSampler', [0,1]);

      drawObj(mesh, mxm(turnY(_.x),
                    mxm(turnX(_.y),
		        scale(.6,.6,.75))));
   }
}


