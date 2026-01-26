import { Matrix } from '/core/modules/math.js'

export function Scene(context) {
   this.context = context;

   let gameCube = new GameCube(this, 'ABCDEF');
   let M = new Matrix();
   this.update = () => {
      M.identity();
      M.turnX(Date.now() / 1000 * 1.234);
      M.turnY(Date.now() / 1000);
      gameCube.update(M);
   }
}

