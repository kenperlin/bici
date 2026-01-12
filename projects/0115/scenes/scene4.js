function Scene() {
   let state = 0, nStates = 5;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   let y = -.4;
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('#a0d0ff').textBox('ENGINEERING', [-.74, .545]);

if (state >= 1) {

      diagram.textBox(`\
Build a
prototype
system.\
`, [-.775,y]);

}

if (state >= 2) {

     diagram.drawColor('white').line([-.625,y],[-.49,y],2);

      diagram.textBox(`\
It should just
run in a
Web browser.\
`, [-.29,y]);

}

if (state >= 3) {

     diagram.drawColor('white').line([-.09,y],[.055,y],2);

      diagram.textBox(`\
Instrument for
human subjects
testing.\
`, [.28,y]);

}

if (state >= 4) {

     diagram.drawColor('white').line([.505,y],[.66,y],2);

      diagram.textBox(`\
Open
source
it!\
`, [.78,y]);

}

   }
}























