navigator.requestMIDIAccess().then(midi => {
   let allInputs = midi.inputs.values();
   for (let input = allInputs.next(); input && !input.done; input = allInputs.next())
      input.value.onmidimessage = message => {
         let cmd = message.data[0];
         let key = message.data[1] - 48;
         if (cmd == 144) midiDown(key);
         if (cmd == 128) midiUp  (key);
      };
});
window.midiDown = key => console.log('midi down', key);
window.midiUp   = key => console.log('midi up', key);
