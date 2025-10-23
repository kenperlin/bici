// ADDING ARMS

function Scene() {

let ball = Shape.sphereMesh(20,10);
let tube = Shape.tubeMesh(20);

this.vertexShader = Shader.defaultVertexShader;
this.fragmentShader = Shader.defaultFragmentShader;

autodraw = false;

let M = new Matrix();

let draw = (mesh, matrix, color) => {
   let m = mxm(perspective(0,0,-.5),
           mxm(turnY(.5 * Math.sin(time)),
	   mxm(scale(.7),
               matrix ?? M.get())));
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
   return this;
}

let Hip = [], Knee = [], Ankle = [];
let Shoulder = [], Elbow = [], Wrist = [];

let pos = m => m.slice(12,15);

let drawRod = (A,B,r) => {
   let D = subtract(B,A);
   draw(tube, mxm(move(mix(A,B,.5)),
              mxm(aim(D),
	          scale(r,r,norm(D)/2))));
}

let sway = 1.0;
let legLen = 1.30;
let stride = legLen * 0.33;
let rate = 4.0;

let time;

this.update = () => {
   time = Date.now() / 1000;

   for (let i = 0 ; i < 2 ; i++) {
      let theta = rate * time + i * Math.PI;
      let c = Math.cos(theta) * .5;
      let s = Math.sin(theta) * .5 + .5;
      let sign = i == 0 ? -1 : 1;
      let hip, ankle;

      M.push();
         M.push().move(sign*.15,.2-.1*s*sway,0);
            hip = M.get();
            M.push().move(
                  0,
                  Math.max(-legLen+.1*s*sway,
                           -1.076*legLen*(1-.20*s)),
                  -stride*c);
               ankle = M.get();
            M.pop();
         M.pop();
      M.pop();

      Hip[i] = pos(hip);
      Ankle[i] = pos(ankle);
      Knee[i] = ik(Hip[i], legLen/2, legLen/2,
                           Ankle[i], [0,0,1]);
  
      draw(ball, mxm(move(Hip[i]), scale(.05)));
      draw(ball, mxm(move(Knee[i]), scale(.05)));
      draw(ball, mxm(move(Ankle[i]), scale(.05)));

      drawRod(Hip[i], Knee[i], .03);
      drawRod(Knee[i], Ankle[i], .03);

      let shoulder, wrist;

      M.push();
         M.push().move(sign*.24,.8+.05*s*sway,0);
            shoulder = M.get();
            M.push().move(0,-.85,.5*c);
               wrist = M.get();
            M.pop();
         M.pop();
      M.pop();

      Shoulder[i] = pos(shoulder);
      Wrist[i] = pos(wrist);
      Elbow[i] = ik(Shoulder[i],.45,.45,Wrist[i],[0,0,-1]);

      draw(ball, mxm(move(Shoulder[i]), scale(.05)));
      draw(ball, mxm(move(Elbow[i]), scale(.05)));
      draw(ball, mxm(move(Wrist[i]), scale(.05)));

      drawRod(Shoulder[i], Elbow[i], .03);
      drawRod(Elbow[i], Wrist[i], .03);
   }

   draw(ball, mxm(move(0,1.2-.01*Math.cos(2*rate*time),0),
                  scale(.12,.16,.12)));

   drawRod(Hip[0], Hip[1], .03);
}

}

