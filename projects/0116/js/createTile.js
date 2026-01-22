import { roundedBox, charMesh } from "/core/modules/shape.js";
import { mxm, scale, move } from "/core/modules/math.js";

export let createTile = ch => {
   return [
      {
        mesh  : roundedBox(.17,.17,.02,.02,2),
	color : [.8,.45,.25],
      },
      {
        mesh  : charMesh(ch),
        matrix: mxm(scale(.19,.19,.04), move(0,0,1.001)),
	color : [.8,.45,.25],
      },
   ];
}
