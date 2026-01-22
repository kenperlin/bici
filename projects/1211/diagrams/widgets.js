function Diagram() {
   let widgets = new Widgets(this,0,.86,1.2,.14,'red,green,x,y,b:foo'.split(','));
   this.onDown = (x,y) => widgets.onDown(x,y);
   this.onDrag = (x,y) => widgets.onDrag(x,y);
   this.onUp   = (x,y) => widgets.onUp  (x,y);
   this.update = () => {
      this.fillColor('white').fillRect([-1,-1],[1,1]);
      widgets.update();
   }
}
