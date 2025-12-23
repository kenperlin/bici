function Scene() {
   let board = [0,0,0,0,0,0,0,0,0];
   let turn = 1;
   new TicTacToe(this,board,turn);
}
