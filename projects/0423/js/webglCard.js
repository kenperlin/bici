function WebglCard(ctx) {

   let ball = Shape.sphereMesh(20,10);
   let tube = Shape.glue(Shape.diskMesh(20,-1),
              Shape.glue(Shape.tubeMesh(20),
                         Shape.diskMesh(20,1)));
   let cube = Shape.cubeMesh();

   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;

   autodraw = false;

   let canvas = document.createElement('canvas');
   canvas.width = canvas.height = 500;
   document.body.appendChild(canvas);

   let cg = new Matrix();

   cg.draw = (mesh, color) => {
      let m = mxm(perspective(0,0,-5), cg.get());
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

   //this.setScene('cg.turnY(time).scale(.6).draw(cube,[0,.8,1]);');

   let _I = [];

   this.set_I = src => {
      console.log('setting _I to', src);
      _I = src;
   }

   this.draw = (x,y,w) => {

      if (scene) {
         let b = ( 'add,cross,dot,ease,evalBezier,hex,mix,norm,'
                 + 'normalize,resize,round,subtract,round2,'
                 + 'transform' ).split(',');
         let m = ( 'PI,abs,ceil,cos,exp,floor,' +
                   'log,max,min,mod,pow,random,' +
                   'round,sign,sin,sqrt,trunc' ).split(',');
         let v = [
            '_I'   , _I,
            'cg'   , cg,
            'ball' , ball,
            'cube' , cube,
            'tube' , tube,
            'time' , Date.now()/1000 - startTime,
         ];
         for (let i = 0 ; i < b.length ; i++ ) window[b[i]] = b[i];
         for (let i = 0 ; i < m.length ; i++ ) window[m[i]] = Math[m[i]];
         for (let i = 0 ; i < v.length ; i+=2) window[v[i]] = v[i+1];

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
      }
      else {
         ctx.fillStyle = '#00a0ff';
	 ctx.fillRect(x-w/2, y-w/2, w, w);
      }
   }
}

