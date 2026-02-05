let sceneTracker = new ObjectTracker();
sceneTracker.addObj(Shape.cubeMesh(), [1, 0, 0], 0, 0, 0, 1, 1, 1);
sceneTracker.addObj(Shape.cubeMesh(), [0, 0, 1], 1, 1, 1, 1, 1, 1);

function Scene() {
   this.vertexShader = Shader.defaultVertexShader;
   this.fragmentShader = Shader.shinyFragmentShader;
   this.update = () => {
      sceneTracker.drawObjs();
   }

   this.onDown = (_x, _y, _z, id) => {
      let [x, y, z] = getNormalizedPoint(_x, _y, _z);
      let h = getHandedness(id);
      sceneTracker.onPinch(x, y, z, h);
   }

   this.onUp = (_x, _y, _z, id) => {
      let h = getHandedness(id);
      sceneTracker.onLeave(h);
   }

   this.onRotate = (rMatrix, handedness, id) => {
      sceneTracker.onRotate(rMatrix, handedness, id);
   }

   this.rescale = (left, right, otherHand) => {
      let vector = subtract(right, left);
      sceneTracker.rescale(vector, otherHand);
   }

   this.onDrag = (_x,_y,_z, id) => {
      let [x, y, z] = getNormalizedPoint(_x, _y, _z);
      let h = getHandedness(id);
      sceneTracker.onDrag(x, y, z, h);
   }

   let getNormalizedPoint = (_x, _y, _z) => {
      _x = 2 * _x + 1 - canvas3D_x() / canvas3D.width;
      _y = 2 * _y + 1 - canvas3D_y() / canvas3D.width - .1;

      return [(_x + 1) / 2, (_y + 1) / 2, (_z + 1) / 2];
   }

   let getHandedness = (id) => {
      return id.split(".")[1];
   }
}
