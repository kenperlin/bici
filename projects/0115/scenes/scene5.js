function Scene() {
   let state = 0, nStates = 14;
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

let Y = [.2,-.04,-.15,-.26,-.37,-.48];

if (state >= 5) {
      diagram.line([-.74,Y[0]],[-.74, state < 6 ? Y[0]
                                    : state < 7 ? Y[1]
				    : state < 8 ? Y[2]
				    : state < 9 ? Y[3]
				    : state <10 ? Y[4]
				    :             Y[5]]);

      diagram.setFont(.053)
             .textBox('Focus of our\nresearch\nquestions', [-.74,.22], 0)
	     .setFont(.048);
}

if (state >= 6)
      diagram.textBox('Speed', [-.74,Y[1]]);

if (state >= 7)
      diagram.textBox('Accuracy', [-.74,Y[2]]);

if (state >= 8)
      diagram.textBox('User preference', [-.74,Y[3]]);

if (state >= 9)
      diagram.textBox('Cognitive load', [-.74,Y[4]]);

if (state >= 10)
      diagram.textBox('Learnability', [-.74,Y[5]]);

if (state >= 11)
      diagram.setFont(.053)
             .textBox('Tools', [-.3,-.4], 0)
	     .setFont(.048);

if (state >= 12)
      diagram.drawColor('white').line([-.19,-.37],[-.02,-.325],2)
             .textBox('Testing protocols', [.2,-.325]);

if (state >= 13)
      diagram.line([-.19,-.42],[-.02,-.475],2)
             .textBox('Data analysis', [.165,-.475]);

   }
}

























