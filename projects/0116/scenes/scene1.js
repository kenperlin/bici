export function Scene(context) {
   // U: Up facing tiles  M: Matching tiles
   let U = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   let M = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];
   this.context = context;
   new MatchGame(this, U, M);
}
