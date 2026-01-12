
function Scene() {
   let state = 0, nStates = 7;
   this.onUp = () => state = (state + 1) % nStates;
   let diagram = overlayDiagram();
   this.update = () => {

      diagram.lineWidth(.02);
      diagram.setFont(.053);
      diagram.fillColor('#c0ffc0').textBox('THEORY', [-.83, .545]);

if (state >= 1) {

      diagram.textBox('Non-linear benefits\nof combining\nembodiment\nwith AI', [.68, .43]);

}

if (state >= 2) {

      diagram.drawColor('#c0ffc0').lineWidth(.01)
             .line([-.4,-.5  ],[ .4,-.5], 2)
             .line([-.4,-.505],[-.4, .1], 2)
             .setFont(.04);

}

if (state >= 3) {

      diagram.textBox('Unassisted\nface-to-face\ncollaboration', [-.2, -.36]);

}

if (state >= 4) {

      diagram.textBox('Add embodied\ninteraction\nonly', [.2, -.36]);

}

if (state >= 5) {

      diagram.textBox('Add data\ndriven model\nbased AI\nassistance', [-.2, -.1]);

}

if (state >= 6) {

      diagram.textBox('Add both AI\nassistance\nand embodied\ninteraction', [.2, -.1]);

}

   }
}





















