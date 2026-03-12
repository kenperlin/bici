import { Sliders } from '/core/modules/ui/sliders.js';

export function Diagram(context) {
   this.context = context;

   let sliders = new Sliders(this,0,.86,1.2,.14,'red,green,x,y'.split(','));
   this.onDown = (x,y) => sliders.onDown(x,y);
   this.onDrag = (x,y) => sliders.onDrag(x,y);
   this.onUp   = (x,y) => sliders.onUp  (x,y);
   this.update = () => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      sliders.update();
   }
}
