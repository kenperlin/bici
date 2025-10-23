// THE SAME WALKING LEGS, BUT USING IK.

function Scene() {

let ball = Shape.sphereMesh(20,10);
let tube = Shape.tubeMesh(20);

this.vertexShader = Shader.defaultVertexShader;
this.fragmentShader = Shader.defaultFragmentShader;

autodraw = false;

let M = new Matrix();

let draw = (mesh, matrix, color) => {
   let m = mxm(perspective(0,0,-.5),
           mxm(turnY(1),
               matrix ?? M.get()));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
   return this;
}

let Hip = [], Knee = [], Ankle = [];

let pos = m => m.slice(12,15);

this.update = () => {
   let time = Date.now() / 1000;

   for (let i = 0 ; i < 2 ; i++) {
      let s = Math.sin(time + i * Math.PI) * .5 + .5;
      let sign = i == 0 ? -1 : 1;
      let hip, ankle;

      M.push();
         M.push().move(sign*.15,.85,0);
            hip = M.get();
            M.push().move(0,-1.4*(1-.5*s),0);
               ankle = M.get();
            M.pop();
         M.pop();
      M.pop();

      // COMPUTE KNEE FROM HIP AND ANKLE VIA IK

      Hip[i] = pos(hip);
      Ankle[i] = pos(ankle);
      Knee[i] = ik(Hip[i],.7,.7,Ankle[i],[0,0,1]);

      // DRAW JOINTS
  
      draw(ball, mxm(move(Hip[i]), scale(.05)));
      draw(ball, mxm(move(Knee[i]), scale(.05)));
      draw(ball, mxm(move(Ankle[i]), scale(.05)));

      // DRAW LIMBS

      let L1 = mix(Hip[i], Knee[i], .5);
      let L2 = mix(Knee[i], Ankle[i], .5);
      let KH = subtract(Knee[i], Hip[i]);
      let AK = subtract(Ankle[i], Knee[i]);

      let leg1 = M.push().move(L1).aim(KH).get();
         draw(tube, mxm(leg1, scale(.03,.03,norm(KH)/2)));
      M.pop();

      let leg2 = M.push().move(L2).aim(AK).get();
         draw(tube, mxm(leg2, scale(.03,.03,norm(AK)/2)));
      M.pop();
   }
}

}

