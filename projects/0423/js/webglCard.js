function WebglCard(ctx) {

   let ball = Shape.sphereMesh(20,10);
   let tube = Shape.glue(Shape.diskMesh(20,-1),
	      Shape.glue(Shape.tubeMesh(20),
	                 Shape.diskMesh(20,1)));
   let cube = Shape.cubeMesh();

   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;

   autodraw = false;

   let canvas = document.createElement('canvas');
   canvas.width = canvas.height = 500;
   document.body.appendChild(canvas);

   let M = new Matrix();

   let draw = (mesh, color) => {
      let m = mxm(perspective(0,0,-5), M.get());
      setUniform('Matrix4fv', 'uMF', false, m);
      setUniform('Matrix4fv', 'uMI', false, inverse(m));
      setUniform('3fv', 'uColor', color ?? [1,1,1]);
      drawMesh(mesh);
      return this;
   }

   gl_start(canvas, this);

   let scene, lastSceneThatWorks;

   this.setScene = src => {
      let newScene;
      try {
         newScene = new Function('M.identity();' + src);
      } catch {
         error => console.log('webgl compile error:', error);
	 return;
      }
      scene = newScene;
   }

   let startTime = Date.now()/1000;

   this.setScene(`
      M.turnY(time).scale(.6);
      draw(cube, [0,.8,1]);
   `);

   let _I = [];

   this.set_I = src => _I = src;

   this.draw = (x,y,w) => {

      if (scene) {
         let v = [
            '_I'        , _I,
            'M'         , M,
	    'ball'      , ball,
	    'cube'      , cube,
	    'tube'      , tube,
            'draw'      , draw,
            'time'      , Date.now()/1000 - startTime,
         ];
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
	    
         for (let i = 0 ; i < v.length ; i+=2) delete window[v[i]];
      }

      ctx.drawImage(canvas, x-w/2, y-w/2, w, w);
   }
}

