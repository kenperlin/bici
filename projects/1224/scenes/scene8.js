function Scene() {
   // U: Up facing tiles  M: Matching tiles
   let U = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   let M = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   new MatchGame(this, U, M);
}
