import { cubeMesh } from '/core/modules/webgl/shape.js'
import { scale } from '/core/modules/math/math.js'
import { addTexture, drawObj, setUniform } from '/core/modules/webgl/webgl.js';
import * as Shader from '/core/modules/webgl/shader.js'

export function Scene(context) {
   this.context = context;

   let cube = cubeMesh(30,15);
   addTexture(0, 'fixed-width-font.png');
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      setUniform('1i', 'uTexture', 0);
      drawObj(cube, scale(.25));
   }
}

