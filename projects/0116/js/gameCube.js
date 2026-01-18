export function GameCube(scene, labels) {
   let cube = Shape.cubeMesh();

   let label = [];
   for (let n = 0 ; n < 6 ; n++)
      label.push(Shape.charMesh(labels.substring(n,n+1)));

   this.update = M => {
      M.scale(.25);
      drawObj(cube , M.get());
      for (let n = 0 ; n < 6 ; n++) {
         M.push();
	    switch (n) {
	    case 1: M.turnY( Math.PI); break;
	    case 2: M.turnX( Math.PI/2).turnZ( Math.PI/2); break;
	    case 3: M.turnX(-Math.PI/2).turnZ(-Math.PI/2); break;
	    case 4: M.turnY( Math.PI/2).turnZ( Math.PI/2); break;
	    case 5: M.turnY(-Math.PI/2).turnZ(-Math.PI/2); break;
	    }
            M.move(0,0,1.001);
            drawObj(label[n], M.get());
         M.pop();
      }
   }
}

