function Scene() {
   let state = 0, nStates = 11;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('#c0ffc0').textBox('THEORY', [-.83, .545]);

if (state >= 1) {

      diagram.textBox('We still need to narrow\nour theoretical focus', [.66, .51]);

}

if (state >= 2) {

      diagram.setFont(.035);

      diagram.textBox('Multimodal\n+ embodied input', [-.297, -.53]);
}

if (state >= 3) {

      diagram.textBox('Combine speech\nwith gesture', [.20, -.53]);
}

if (state >= 4) {


      diagram.textBox('Remapping\nembodied input', [-.311, -.40]);
}

if (state >= 5) {

      diagram.textBox('Interacting\nwith large data', [.22, -.40]);
}

if (state >= 6) {


      diagram.textBox('One person\nversus two people', [-.29, -.27]);
}

if (state >= 7) {

      diagram.textBox('Synchronous vs.\nasynchronous', [.205, -.27]);
}

if (state >= 8) {

      diagram.textBox('AI: gesture, layout, text-to-code, hints, summaries ...', [-.047, -.16]);
}

if (state >= 9) {

      diagram.textBox(`\
TYPES OF SPEECH
(Austin & Searle)

Locutionary
Illocutionary
Perlocutionary

INTENTION

Assertive
Directive
Commissive
Expressive
Declarative

Direct vs Indirect

Transactional
vs Interactional\
`, [-.78,-.07], 0);
}

if (state >= 10) {

      diagram.textBox(`\
TYPES OF GESTURE
(Ekman & Wallace)

Beats
Icons
Regulators
Affect displays
Adaptors
Diectic
Emblems

BODY PARTS

Hands
Face
Body
Head
Eyes

Static vs Dynamic\
`, [.76, -.07], 0);
}

   }
}
