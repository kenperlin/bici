function Diagram() {
   this.scaleSlider = '';
   let sliderNames = `red,green,x,y`;
   let sliders = new Sliders(this, 0, .86, 1.2, .14, sliderNames.split(','));
   // let sliders = new Sliders(this,0,.86,1.2,.14,`red,green,x,y,${this.scaleSlider}`.split(','));
   this.onDown = (x,y) => sliders.onDown(x,y);
   this.onDrag = (x,y) => sliders.onDrag(x,y);
   this.onUp   = (x,y) => sliders.onUp  (x,y);

   // LIsten for AI commands to add the scale slider
   window.addEventListener('sceneCommand', (event) => {
      const commands = event.detail;
      if (commands.action === "addScaleSlider" && !this.scaleSlider) {
         this.scaleSlider = 'scal';

         sliderNames += `,${this.scaleSlider}`;
         sliders = new Sliders(this, 0, .86, 1.2, .14, sliderNames.split(','));
         console.log('Added scale slider');
      }

   });

   this.update = () => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      sliders.update();
   }
}
