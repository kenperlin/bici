function WebglCard(ctx) {

   let xy = [0,0], event = '';
   this.mousePress   = pos => { xy = pos; console.log('press'  , xy[0], xy[1]); event = 'press'   };
   this.mouseDrag    = pos => { xy = pos; event = 'drag'    };
   this.mouseClick   = pos => { xy = pos; event = 'click'   };
   this.mouseRelease = pos => { xy = pos; event = 'release' };

   let ball = Shape.sphereMesh(20,10);
   let tube = Shape.glue(Shape.diskMesh(20,-1),
              Shape.glue(Shape.tubeMesh(20),
                         Shape.diskMesh(20,1)));
   let cube = Shape.cubeMesh();

   let tubex = { triangle_strip: true, data: new Float32Array(tube.data) };
   let tubey = { triangle_strip: true, data: new Float32Array(tube.data) };
   Shape.transform(tubex, turnY(Math.PI/2));
   Shape.transform(tubey, turnX(Math.PI/2));

   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;

   autodraw = false;

   let canvas = document.createElement('canvas');
   canvas.width = canvas.height = 500;
   document.body.appendChild(canvas);

   let cg = new Matrix();

   cg.draw = (mesh, color, s) => {
      let m = perspective(0,0,-5);
      if (! isFirstPlayer())
         m = mxm(m, scale(1,1,-1));
      m = mxm(m, cg.get());
      if (s !== undefined)
         m = mxm(m, scale(s));
      setUniform('Matrix4fv', 'uMF', false, m);
      setUniform('Matrix4fv', 'uMI', false, inverse(m));
      setUniform('3fv', 'uColor', color ?? [1,1,1]);
      drawMesh(mesh);
      return cg;
   }

   gl_start(canvas, this);

   let scene, lastSceneThatWorks;

   this.setScene = src => {
      let newScene;
      try {
         newScene = new Function('cg.identity();' + src);
      } catch {
         error => console.log('webgl compile error:', error);
         return;
      }
      scene = newScene;
   }

   let startTime = Date.now()/1000;

   let _I = [];

   this.set_I = src => {
      //console.log('setting _I to', src);
      _I = src;
   }

   this.draw = (x,y,w) => {

      if (scene) {
         let b = ( 'add,cross,dot,ease,evalBezier,'
                 + 'hex,ik,mix,norm,normalize,resize,round,'
                 + 'subtract,round2,transform' ).split(',');
         let m = ( 'PI,abs,acos,asin,atan2,ceil,cos,exp,floor,' +
                   'log,max,min,mod,pow,random,' +
                   'round,sign,sin,sqrt,trunc' ).split(',');
         let v = [
            '_X'   , xy[0],
            '_Y'   , xy[1],
            'event', event,
            '_I'   , _I,
            'cg'   , cg,
            'ball' , ball,
            'cube' , cube,
            'tube' , tube,
            'tubey', tubey,
            'time' , Date.now()/1000 - startTime,
         ];
         for (let i = 0 ; i < b.length ; i++ ) window[b[i]] = b[i];
         for (let i = 0 ; i < m.length ; i++ ) window[m[i]] = Math[m[i]];
         for (let i = 0 ; i < v.length ; i+=2) window[v[i]] = v[i+1];

         window.IK = (L1,L2,C) => {
           let B = ik([0,0,0],L1,L2,C,[0,1,0]);
           let AB = subtract(B,[0,0,0]);
           let BC = subtract(C,B);
           return [ atan2(C[2],C[0]),
                   -acos(AB[1]/norm(AB)),
                    acos(dot(AB,BC)/(norm(AB)*norm(BC))) ];
         }

         let isError = false;
         try {
            scene();
         }
         catch {
            error => console.log('webgl runtime error:', error);
            isError = true;
         }
         if (isError) {
            scene = lastSceneThatWorks;
            this.setScene(scene);
         }
         else
            lastSceneThatWorks = scene;

         for (let i = 0 ; i < b.length ; i++ ) delete window[b[i]];
         for (let i = 0 ; i < m.length ; i++ ) delete window[m[i]];
         for (let i = 0 ; i < v.length ; i+=2) delete window[v[i]];

         ctx.drawImage(canvas, x-w/2, y-w/2, w, w);

         if (event == 'release' || event == 'click')
            event = 'up';
      }
      else {
         ctx.fillStyle = '#00a0ff';
         ctx.fillRect(x-w/2, y-w/2, w, w);
      }
      //ctx.strokeStyle = '#000000';
      //ctx.strokeRect(x-w/2, y-w/2, w, w);
   }
}

