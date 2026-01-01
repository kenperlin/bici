// RENDER A "W"

function Scene() {

   let createPathsMesh = (width, paths) => {
      let vertices = [];
      let addVertex = pos => vertices.push(pos,[0,0,1],[0,0]);
      for (let n = 0 ; n < paths.length ; n++) {
         let path = paths[n];
         for (let i = 0 ; i < path.length-1 ; i++) {
            let b = path[i  ];
            let c = path[i+1];
            let a = i>0 ? path[i-1] : add(b,subtract(b,c));
            let da = normalize(subtract(b, a));
            let dc = normalize(subtract(c, b));
            let db = normalize(add(da, dc));
            let s = dot(da, db);
            da = resize(da, width/2);
            dc = resize(dc, width/2);
            db = resize(db, width/2);
            let ea = [-da[1]  , da[0]  , 0];
            let ec = [-dc[1]  , dc[0]  , 0];
            let eb = [-db[1]/s, db[0]/s, 0];
            if (i == 0)
               b = subtract(b, da);
            if (dot(da, dc) < 0) {
               if (n > 0 && i == 0)
                  addVertex(subtract(b, ea));
               addVertex(subtract(b, ea));
               addVertex(add(b, ea));
               addVertex(subtract(b, ec));
               addVertex(add(b, ec));
            }
            else {
               if (n > 0 && i == 0)
                  addVertex(subtract(b, eb));
               addVertex(subtract(b, eb));
               addVertex(add(b, eb));
            }
            if (i == path.length-2) {
               addVertex(subtract(add(c, dc), ec));
               addVertex(add(add(c, dc), ec));
            }
            if (n < paths.length-1 && i == path.length-2)
               addVertex(add(add(c, dc), ec));
         }
      }
      return {
         triangle_strip: true,
	 data: new Float32Array(vertices.flat())
      }
   }

   console.log(mesh);

let cube = Shape.cubeMesh();

this.vertexShader = Shader.defaultVertexShader;
this.fragmentShader = Shader.defaultFragmentShader;

autodraw = false;

let M = new Matrix();

let draw = (mesh, matrix, color) => {
   let m = mxm(perspective(0,0,-.5),matrix??M.get());
   setUniform('Matrix4fv', 'uMF', false, m);
   setUniform('Matrix4fv', 'uMI', false, inverse(m));
   setUniform('3fv', 'uColor', color ?? [1,1,1]);
   drawMesh(mesh);
   return this;
}

this.update = () => {
   vertexMap(['aPos', 3, 'aNor', 3, 'aUV', 2]);
   let time = Date.now() / 1000;

   let mesh = createPathsMesh(.2, [
      [ [-.4, .8,0],
        [-.4,-.8,0],
	[  0,-.4,0],
	[ .4,-.8,0],
	[ .4, .8,0]],
   ]);
   console.log(mesh);

   draw(mesh, mxm(turnX(0 * time),
              mxm(turnY(0 * time),
	          scale(.8))),[0,.5,1]);
}

}

