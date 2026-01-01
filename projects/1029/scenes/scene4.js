// RENDER A LARGE TEXT MESSAGE IN A LINEFONT

function Scene() {

   let createPathsMesh = (lineWidth, paths) => {
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
            da = resize(da, lineWidth/2);
            dc = resize(dc, lineWidth/2);
            db = resize(db, lineWidth/2);
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

   let createTextMesh = text => {
      let myPaths = [], lines = text.split('\n'), c;
      for (let row = 0 ; row < lines.length ; row++)
      for (let col = 0 ; col < lines[row].length ; col++)
         if ((c = lines[row].charCodeAt(col) & 127) > 32) {
            let x = .019*col, y = -.0375*row;
            let paths = linefont[c - 32].paths;
            for (let i = 0 ; i < paths.length ; i++) {
               let myPath = [], path = paths[i];
               for (let j = 0 ; j < path.length ; j++) {
	          let p = path[j];
                  myPath.push([ x + p[0] / 4000,
                                y - p[1] / 4000, 0]);
               }
               myPaths.push(myPath);
            }
         }
      return createPathsMesh(.0025, myPaths);
   }

   let mesh = createTextMesh(textSampleLarge);

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
   draw(mesh, mxm(turnY(.1*Math.sin(3*time)),
              mxm(move(-.95,.95,0),
                  scale(.75))),[0,0,0]);
}

}

