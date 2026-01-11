/*
(1) VISION: A statement of what we aim to enable in the long run.

(2) THEORY: A new structural theory of user interaction.

(3) ENGINEERING: Our plan to build an open-source toolkit to support developing that theory.

(4) EVALUATION: Some specific use cases through which we will use (3) to research (2).

	Building an interactive structural diagram
	Creating and iterating on a 3D model
	Search and organization through a corpus of data
*/

function Scene() {
   let state = 0, nStates = 5;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = { width: screen.width, height: screen.height };
   addDiagramProperties(diagram, octx);
   diagram.lineWidth(.02);
   let y = -.4;
   this.update = () => {
      octx.font = '40px Helvetica';

      octx.fillStyle = '#ffffff';
      diagram.textBox('Our plan for our NSF funded VALIS project', [0, y + .25]);

if (state >= 1) {

      octx.font = '30px Helvetica';

      octx.fillStyle = '#ffc0c0';
      diagram.textBox(`\
1. VISION

What VALIS
will enable in
the long run\
`, [-.78,y]);

}

if (state >= 2) {

     diagram.line([-.64,y],[-.52,y],2);

      octx.fillStyle = '#c0ffc0';
      diagram.textBox(`\
2. THEORY

A new structural
framework for
user interaction\
`, [-.35,y]);

}

if (state >= 3) {

     diagram.line([-.18,y],[-.06,y],2);

      octx.fillStyle = '#a0d0ff';
      diagram.textBox(`\
3. ENGINEERING

Build an open-source
toolkit to develop
and test our theory\
`, [.15,y]);

}

if (state >= 4) {

     diagram.line([.37,y],[.49,y],2);

      octx.fillStyle = '#e0c0ff';
      diagram.textBox(`\
4. EVALUATION

Specific use cases
through which we will
test our theory\
`, [.70,y]);

}

   }

}





















