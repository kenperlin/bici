/*
(1) VISION: A statement of what we aim to enable in the long run.
*/

function Scene() {
   let state = 0, nStates = 6;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('#ffb0c0').textBox('VISION', [-.83, .545]);

if (state >= 1) {

      diagram.textBox(`\
Improve one-to-one collaboration
between people, by combining
embodied interaction
with AI assistance.\
`, [.52,.44]);

}

if (state >= 2) {

      diagram.textBox(`\
What this project
can enable now:\
`, [-.65,0]);

}

if (state >= 3) {

      diagram.drawColor('white').line([-.65,-.1],[-.65,-.26],2);

      diagram.textBox(`\
Better collaboration
over one-to-one
video chat\
`, [-.65,-.4]);

}

if (state >= 4) {

      diagram.textBox(`\
What this project can
enable in the future:\
`, [.55,0]);

}

if (state >= 5) {

      diagram.drawColor('white').line([.55,-.1],[.55,-.26],2);

      diagram.textBox(`\
Better collaboration
between people wearing
future XR glasses\
`, [.55,-.4]);

}

   }
}





















