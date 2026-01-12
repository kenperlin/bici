/*
(1) VISION: A statement of what we aim to enable in the long run.
(2) THEORY: A new structural theory of user interaction.
(3) ENGINEERING: Our plan to build an open-source toolkit to support developing that theory.
(4) EVALUATION: Some specific use cases through which we will use (3) to research (2).
*/

function Scene() {
   let state = -1, nStates = 5;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   let y = -.4;
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('white').textBox('The plan for our\nVALIS project', [-.72, .49]);
      diagram.setFont(.04);

if (state >= 1) {

      diagram.fillColor('#ffb0c0').textBox(`\
1. VISION

What VALIS
will enable in
the long run\
`, [-.775,y]);

}

if (state >= 2) {

     diagram.drawColor('white').line([-.625,y],[-.525,y],2);

      diagram.fillColor('#c0ffc0').textBox(`\
2. THEORY

A new structural
framework for
user interaction\
`, [-.35,y]);

}

if (state >= 3) {

     diagram.drawColor('white').line([-.17,y],[-.07,y],2);

      diagram.fillColor('#a0d0ff').textBox(`\
3. ENGINEERING

Build an open-source
toolkit to develop
and test our theory\
`, [.15,y]);

}

if (state >= 4) {

     diagram.drawColor('white').line([.375,y],[.48,y],2);

      diagram.fillColor('#e0c0ff').textBox(`\
4. EVALUATION

Specific use cases
through which we will
test our theory\
`, [.70,y]);

}

   }
}






















