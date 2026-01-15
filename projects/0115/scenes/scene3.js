
function Scene() {
   let state = 0, nStates = 10;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('#c0ffc0').textBox('THEORY', [-.83, .545]);

if (state >= 1) {

      //diagram.textBox('Non-linear benefits\nof combining\nembodiment\nwith AI', [.68, .43]);
      diagram.textBox('We still need to narrow\nour theoretical focus', [.67, .51]);

}

if (state >= 2) {

      diagram.setFont(.04);

      diagram.textBox('Multimodal\nembodied input', [-.25, -.36]);
}

if (state >= 3) {

      diagram.textBox('Combining speech\nwith gesture', [.25, -.36]);
}

if (state >= 4) {


      diagram.textBox('Remapping\nembodied input', [-.25, -.1]);
}

if (state >= 5) {

      diagram.textBox('Interacting\nwith large data', [.25, -.1]);
}

if (state >= 6) {


      diagram.textBox('One person\nversus two people', [-.25, .16]);
}

if (state >= 7) {

      diagram.textBox('AI: gesture, layout,\nchat, text-to-code ...', [.25, .16]);
}
if (state >= 8) {

      diagram.setFont(.035);

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

if (state >= 9) {

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
`, [.77, -.07], 0);
}

   }
}


































