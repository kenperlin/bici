import { drawObj } from "/core/modules/webgl/webgl.js";
import { ease, noise, mxm, move, turnY, scale } from "/core/modules/math/math.js"
import { centeredText } from "/core/modules/utils/canvasUtils.js";

export function MatchGame(scene,U,M) {
   let label = ['A','B','C','D','E','F','G','H',
                'A','B','C','D','E','F','G','H'];
   
   let seed = scene.context.seed;
   for (let k = 1 ; k < 100 ; k++)
   for (let i = 0 ; i < 16 ; i++)
      if (k % 16 && noise(k + .5, i + .5, seed) > 0) {
         let j = (i + k) % 16;
         let tmp  = label[i];
         label[i] = label[j];
         label[j] = tmp;
      }

   let A = scene.context.A ??= [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0];

   let contains = (n,x,y) => Math.abs(x - tx(n)) < .2 && Math.abs(y - ty(n)) < .2;

   let mx, my;
   scene.onMove = (x,y) => { mx = x; my = y; }
   scene.onUp = (x,y) => {
      for (let n = 0 ; n < 16 ; n++)
         if (contains(n,x,y) && ! M[n]) {
            U[n] = 1 - U[n];
            for (let i = 0 ; i < 16 ; i++)
	       if (i != n && U[i] && label[i] == label[n])
	          M[i] = M[n] = 1;
            for (let i = 0 ; i < 16 ; i++)
	       if (i != n && ! M[i] && label[i] != label[n])
	          U[i] = 0;
         }
      scene.context.codeArea.setVar('U', U);
      scene.context.codeArea.setVar('M', M);
   }
   let tile = [];
   for (let n = 0 ; n < 16 ; n++)
      tile.push(createTile(label[n]));
   let tx = n => ((n&3)  - .25) * .4 - .50;
   let ty = n => ((n>>2) - .25) * .4 - .65;

   let round = t => (100 * t + .5 >> 0) / 100;

   let message = text => {
      const canvas = scene.context.canvas;
      const rect = canvas.getRect();
      
      const x = rect.left + rect.width / 2;
      const y = rect.top - 20;

      OCTX.fillStyle = '#ffffff60';
      OCTX.beginPath();
      OCTX.roundRect(x - 200, y - 90, 400, 180, 40);
      OCTX.fill();

      OCTX.font = '35px Helvetica';
      OCTX.fillStyle = '#000000';
      let line = text.split('\n');
      for (let n = 0 ; n < line.length ; n++)
         centeredText(OCTX, line[n], x, y - 35 + 50 * n);
   }

   let time;

   scene.update = () => {

      let newTime = Date.now() / 1000;
      let deltaTime = time ? newTime - time : .01;
      time = newTime;

      for (let n = 0 ; n < 16 ; n++) {
         drawObj(tile[n],
	         mxm(move(tx(n),ty(n),0),
                     mxm(turnY(Math.PI * ease(1 - A[n])),
		         scale(.9))),
		 M[n] ? [1,1,1] : contains(n,mx,my) ? [1,.67,.41] : null);
         A[n] = Math.max(0, Math.min(1, round(A[n] + (U[n]?1:-1) * deltaTime)));
      }

      let score = 0;
      for (let n = 0 ; n < 16 ; n++)
         score += M[n] + A[n];
      if (score == 0)
         message('TRY TO FIND\nALL MATCHING PAIRS\nOF TILES.');
      if (score == 32)
         message('CONGRATULATIONS!\nYOU FOUND\nEVERY MATCH.');

      // IF ENLARGED HEAD TRACKING, GIVE VISUAL FEEDBACK.

      // if (tracking_isLarge) {
         // tracking_isSteadyEnabled = true;
         // let w = screen.width, h = screen.height;
         // OCTX.strokeStyle = '#00000020';
         // OCTX.lineWidth = 8;
         // OCTX.fillStyle = '#00000020';
         // for (let j = 0 ; j < 4 ; j++)
         // for (let i = 0 ; i < 4 ; i++) {
         //    let x = w/2 - .3 * h + .2 * h * i;
         //    let y = .275 * h + .2 * h * j;
         //    OCTX.strokeRect(x - .1 * h, y - .1 * h, .18 * h, .18 * h);
         // }
         // OCTX.fillStyle = 'black';
         // OCTX.fillRect(tracking_l2x(headX) - 8,
	      //          tracking_l2y(headY) - 8, 16, 16);

      // }
   }
}
