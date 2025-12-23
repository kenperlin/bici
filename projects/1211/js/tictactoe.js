function TicTacToe(scene, board, turn) {
   let T = Shape.torusMesh(30,15,.3);
   let C = Shape.cubeMesh();
   let isMyTurn = true;
   scene.vertexShader   = Shader.defaultVertexShader;
   scene.fragmentShader = Shader.shinyFragmentShader;
   scene.update = () => {
      isMyTurn = ! isMultiPlayer() || (turn==1) == isFirstPlayer();
      drawObj(C, mxm(move(0, .3,0),scale(1,.02,.02)));
      drawObj(C, mxm(move(0,-.3,0),scale(1,.02,.02)));
      drawObj(C, mxm(move( .3,0,0),scale(.02,1,.02)));
      drawObj(C, mxm(move(-.3,0,0),scale(.02,1,.02)));
      for (let n = 0 ; n < 9 ; n++) {
         let x = .6 * ((n % 3 ) - 1);
         let y = .6 * ((n/3>>0) - 1);
	 if (board[n] == 1)
	    for (let s = -1 ; s <= 1 ; s += 2)
	       drawObj(C, mxm(move(x,y,0),
	                  mxm(turnZ(s * Math.PI/4),
	                      scale(.3,.04,.04))));
	 if (board[n] == 2)
	    drawObj(T, mxm(move(x,y,0),scale(.2)));
      }
   }
   scene.onUp = (x,y) => {
      if (isMyTurn) {
         let col = x < -.3 ? 0 : x < .3 ? 1 : 2;
         let row = y < -.3 ? 0 : y < .3 ? 1 : 2;
         if (col >= 0 && col < 3 && row >= 0 && row < 3)
            board[col + 3 * row] = turn;
         codeArea.setVar('board', '[' + board + ']');
         codeArea.setVar('turn', 3 - turn);
      }
   }
}

