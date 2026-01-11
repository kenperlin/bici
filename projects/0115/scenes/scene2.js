// Test using images in diagrams.

function Scene() {
   let diagram = overlayDiagram();
   this.update = () => {
      diagram.image('multiple_spheres.png', [0,.2], .3);
      diagram.image('refraction.png'      , [0,-.2], .3);
      diagram.image('fish.png'            , [.4,0], .3);
   }
}





















