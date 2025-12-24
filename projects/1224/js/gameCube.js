function GameCube(scene, labels) {
   let cube = Shape.cubeMesh();

   let addAsciiTexture = (mesh, ch) => {
      let n = ch.charCodeAt(0) - 32;
      let row = 7 - (n / 12 >> 0);
      let col =      n % 12;
      for (let i = 0 ; i < mesh.data.length ; i += vertexSize) {
         mesh.data[i + 6] = (col + mesh.data[i + 6]) / 12;
         mesh.data[i + 7] = (row + mesh.data[i + 7]) /  8;
      }
   }

   let label = [];
   for (let n = 0 ; n < 6 ; n++) {
      label.push(Shape.squareMesh());
      addAsciiTexture(label[n], labels.substring(n,n+1));
   }

   this.update = M => {
      for (let n = 0 ; n < 6 ; n++) {
         M.push();
	    switch (n) {
	    case 1: M.turnY( Math.PI); break;
	    case 2: M.turnX( Math.PI/2).turnZ( Math.PI/2); break;
	    case 3: M.turnX(-Math.PI/2).turnZ(-Math.PI/2); break;
	    case 4: M.turnY( Math.PI/2).turnZ( Math.PI/2); break;
	    case 5: M.turnY(-Math.PI/2).turnZ(-Math.PI/2); break;
	    }
            M.move(0,0,.251);
            M.scale(.15,.25,1);
            drawObj(label[n], M.get(), [1,1,1], 15);
         M.pop();
      }
      M.push();
         M.scale(.25);
         drawObj(cube , M.get());
      M.pop();
   }
}

