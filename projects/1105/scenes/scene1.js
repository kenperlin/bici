function Scene() {

   this.vertexShader = `#version 300 es
      uniform mat4 uMF, uMI, uMat[20];
      in  vec3 aPos, aNor, aWts0, aWts1;
      out vec3 vPos, vNor;
      void main() {
         vec4 p = uMF * vec4(aPos, 1.);
         vec4 pos = vec4(0.);
         for (int i = 0 ; i < 20 ; i++) {
            if (i == int(aWts0.x)) pos += mod(aWts0.x, 1.) * (uMat[i] * p);
            if (i == int(aWts0.y)) pos += mod(aWts0.y, 1.) * (uMat[i] * p);
            if (i == int(aWts0.z)) pos += mod(aWts0.z, 1.) * (uMat[i] * p);
            if (i == int(aWts1.x)) pos += mod(aWts1.x, 1.) * (uMat[i] * p);
            if (i == int(aWts1.y)) pos += mod(aWts1.y, 1.) * (uMat[i] * p);
            if (i == int(aWts1.z)) pos += mod(aWts1.z, 1.) * (uMat[i] * p);
         }
         vec4 nor = vec4(aNor, 0.) * uMI;
         gl_Position = pos * vec4(1.,1.,-.1,1.);
         vPos = pos.xyz;
         vNor = nor.xyz;
      }
   `;

   this.fragmentShader = Shader.defaultFragmentShader;

   let blobs = new Blobs();

   let m1 = mxm(move(-.13,-.05,0),scale(.21,.07,.07));
   let m2 = mxm(move(-.01, .00,0),scale(.08,.05,.05));
   let m3 = mxm(move( .14,-.05,0),scale(.20,.06,.06));

   blobs.addBlob(blobs.SPHERE, m1, .5);
   blobs.addBlob(blobs.SPHERE, m2, .5);
   blobs.addBlob(blobs.SPHERE, m3, .5);

   let mesh = { data: implicitSurfaceTriangleMesh(blobs, 150) };

   let M = new Matrix();

   this.update = () => {
      let time = Date.now() / 1000;
      let A, B, C;
      let bend = c(time) * .5 - .5;

      M.push();
         M.move(-.2,.55-.1*bend,0);
         M.turnZ(-Math.PI/2 - bend);
         M.move(.3,0,0);
         A = M.get();
         M.move(.05,0,0);
         M.turnZ(bend);
         M.move(.05-.1*bend,0,0);
         B = M.get();
         M.move(.05,0,0);
         M.turnZ(bend);
         M.move(.05,0,0);
         C = M.get();
      M.pop();

      setUniform('Matrix4fv', 'uMat', false, [A,B,C].flat());
      vertexMap(['aPos',3,'aNor',3,'aWts0',3,'aWts1',3]);
      drawObj(mesh, scale(2), [1,.7,.5]);
   }
}

