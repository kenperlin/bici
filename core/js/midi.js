{
   const notes = `a3,a3s,b3,c3,c3s,d3,d3s,e3,f3,f3s,g3,g3s,
                  a4,a4s,b4,c4,c4s,d4,d4s,e4,f4,f4s,g4,g4s,
                  a5,a5s,b5,c5,c5s,d5,d5s,e5,f5,f5s,g5,g5s`.split(',');

   const sound = [];
   for (let i = 0 ; i < notes.length ; i++)
      (sound[i] = new Audio()).src = 'pianoNotes/' + notes[i].trim() + '.mp3';
   
   navigator.requestMIDIAccess().then(midi => {
      let allInputs = midi.inputs.values();
      for (let input = allInputs.next(); input && !input.done; input = allInputs.next())
         input.value.onmidimessage = message => {
            let cmd  = message.data[0];
            let note = message.data[1] - 45;
            if (cmd == 144) sound[note].play();
            if (cmd == 128) sound[note].pause();
         }
   });
}
