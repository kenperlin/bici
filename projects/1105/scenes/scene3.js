function Scene(){

   let blobs = new Blobs();
   blobs.addBlob( blobs.SPHERE , scale(.7),  1 );
   blobs.addBlob( blobs.SPHERE , mxm(move(.15,.15,.15),scale(.5)), -1 );
   let mesh = { data: implicitSurfaceTriangleMesh(blobs, 100) };
   let mat = [];
   for (let n = 0 ; n < blobs.nBlobs() ; n++)
      mat.push(identity());

   this.vertexShader=`#version 300 es
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
   `,

   this.fragmentShader = Shader.shinyFragmentShader;

   this.update = () => {
      let time = Date.now() / 1000;
      let s = .3*Math.sin(3*time);
      mat[1] = move(s,s,s);
      setUniform('Matrix4fv', 'uMat', false, mat.flat());
      vertexMap(['aPos',3,'aNor',3,'aWts0',3,'aWts1',3]);
      drawObj(mesh, identity(), [1,0,0]);
   }
}
