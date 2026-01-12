function Scene() {
   let state = 0, nStates = 13;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   let y = -.4;
   this.update = () => {

      diagram.lineWidth(.02)
             .setFont(.053)
             .fillColor('#e0c0ff').textBox('EVALUATION', [-.74, .545]);

if (state >= 1) {
      diagram.line([.67,.53],[.67,state<2?.53:state<3?.25:state<4?.05:-.15]);

      diagram.textBox('Example test cases\nwe will build', [.67,.53], 0)
	     .setFont(.048);
}

if (state >= 2)
      diagram.textBox('Design and build\nstructural diagrams', [.67,.25]);

if (state >= 3)
      diagram.textBox('Design and build\n3D models', [.67,.05]);

if (state >= 4)
      diagram.textBox('Data search and\norganization', [.67,-.15]);

if (state >= 5) {
      diagram.line([-.74,.2],[-.74,state<6?.2:state<7?-.04:state<8?-.18:state<9?-.32:-.46]);

      diagram.setFont(.053)
             .textBox('Focus of our\nresearch\nquestions', [-.74,.22], 0)
	     .setFont(.048);
}

if (state >= 6)
      diagram.textBox('Speed', [-.74,-.04]);

if (state >= 7)
      diagram.textBox('Accuracy', [-.74,-.18]);

if (state >= 8)
      diagram.textBox('User preference', [-.74,-.32]);

if (state >= 9)
      diagram.textBox('Cognitive load', [-.74,-.46]);

if (state >= 10)
      diagram.setFont(.053)
             .textBox('Tools', [-.3,-.4], 0)
	     .setFont(.048);

if (state >= 11)
      diagram.drawColor('white').line([-.19,-.37],[-.02,-.325],2)
             .textBox('Testing protocols', [.2,-.325]);

if (state >= 12)
      diagram.line([-.19,-.42],[-.02,-.475],2)
             .textBox('Data analysis', [.165,-.475]);

   }
}

























