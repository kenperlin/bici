// ADDING REACHING AND LOOKING

function Scene() {

let ball = Shape.sphereMesh(20,10);
let tube = Shape.tubeMesh(20);
let cube = Shape.cubeMesh();

this.vertexShader = Shader.defaultVertexShader;
this.fragmentShader = Shader.defaultFragmentShader;

autodraw = false;

let M = new Matrix();

let draw = (mesh, matrix, color) => {
   let m = mxm(perspective(0,0,-.5),
           mxm(turnY(0),
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

   let P = [-.1 + .1 * Math.cos(3 * time),.5 + .1 * Math.sin(3*time),.7];

   let grab = ease(Math.sin(time) + .5);

   grab = 0; //-----

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
      Knee[i] = ik(Hip[i],.65,.65,Ankle[i],[0,0,1]);
  
      draw(ball, mxm(move(Hip[i]), scale(.05)));
      draw(ball, mxm(move(Knee[i]), scale(.05)));
      draw(ball, mxm(move(Ankle[i]), scale(.05)));

      drawRod(Hip[i], Knee[i], .03);
      drawRod(Knee[i], Ankle[i], .03);

      let shoulder, wrist;

      M.push();
         let S = [sign*.24,.8+.05*s*sway,0];
         let d = resize(subtract(P,S), .1*sign*grab);
         S = add(S, [0, d[1], d[2]-d[0]]);
         M.push().move(S);
            shoulder = M.get();
            M.push().move(0,-.85,.5*c);
               wrist = M.get();
            M.pop();
         M.pop();
      M.pop();

      Shoulder[i] = pos(shoulder);
      Wrist[i] = pos(wrist);

      if (i == 1) {
         Wrist[i] = mix(Wrist[i], P, grab);
         Wrist[i] = add(Wrist[i],
	                resize([1,0,0], .5*grab*(1-grab)));
      }

      Elbow[i] = ik(Shoulder[i],.45,.45,Wrist[i], [0,-1,-1]);

      draw(ball, mxm(move(Shoulder[i]), scale(.05)));
      draw(ball, mxm(move(Elbow[i]), scale(.05)));
      draw(ball, mxm(move(Wrist[i]), scale(.05)));

      drawRod(Shoulder[i], Elbow[i], .03);
      drawRod(Elbow[i], Wrist[i], .03);
   }

   let Head = [0,1.2-.01*Math.cos(2*rate*time),0];
   let HeadFwd = mix([0,0,1],subtract(P,Head),.01+grab);
   M.push().move(Head).aim(HeadFwd);
      draw(ball, mxm(M.get(), scale(.12,.16,.12)));
      draw(ball, mxm(M.get(),
                 mxm(move(-.05,0,.12),scale(.03))), [0,0,0]);
      draw(ball, mxm(M.get(),
                 mxm(move( .05,0,.12),scale(.03))), [0,0,0]);
   M.pop();

   drawRod(Hip[0], Hip[1], .03);

   // draw(cube, mxm(move(P), scale(.05)), [1,0,0]); //-----
}

}





