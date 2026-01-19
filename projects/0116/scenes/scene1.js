import { cubeMesh } from '../../../core/modules/shape.js'
import { drawObj } from '../../../core/modules/webgl.js'
import { mxm, turnY, scale } from '../../../core/modules/math.js'
import * as Shader from '../../../core/modules/shader.js'

export function Scene() {
   let cube = cubeMesh();
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.defaultFragmentShader;
   this.update = () => {
      let time = Date.now() / 1000;
      drawObj(cube, mxm(turnY(time),scale(.3)));
   }
}

