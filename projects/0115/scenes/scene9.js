// Visualizing a miniature avatar of my hands.

function Scene() {
   let x = 0, y = 0;
   let diagram = overlayDiagram();
   this.update = () => {
      diagram.image('left_hand_shadow.png', [-.7+.05*x, .4+.05*y], .1);
   }
   this.onDrag = (_x,_y) => { x = _x; y = _y; }
}

