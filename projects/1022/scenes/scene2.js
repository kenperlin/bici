// LEGS WALKING VIA A FORWARD KINEMATICS HIERARCHY

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

      // ALTERNATING LEGS (OPPOSITE PHASE)

      let s = Math.sin(time + i * Math.PI) * .5 + .5;

      let sign = i == 0 ? -1 : 1;
      let hip, knee, ankle;
      M.push().move(sign*.15,.85,0);
         hip = M.get();
         M.push().turnX(-s).move(0,-.7,0);
            knee = M.get();
            M.push().turnX(2*s).move(0,-.7,0);
               ankle = M.get();
            M.pop();
         M.pop();
      M.pop();

      // DRAW JOINTS

      draw(ball, mxm(hip, scale(.05)));
      draw(ball, mxm(knee, scale(.05)));
      draw(ball, mxm(ankle, scale(.05)));

      // REMEMBER JOINT POSITIONS

      Hip[i] = pos(hip);
      Knee[i] = pos(knee);
      Ankle[i] = pos(ankle);

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

