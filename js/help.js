
let help = {

display : ctx => {

   let fs = fontSize * 1.7 >> 0;

   if (help.isSplash) {
      ctx.fillStyle = '#ffffff80';
      ctx.fillRect(18, 20, 333 * fs / 40, 35 * 1.5);
      ctx.fillStyle = 'black';
      ctx.font = 'bold ' + fs + 'px Arial';
      ctx.fillText("For help, type 'h'", 26, 60);
   }

   if (help.isHelp) {
      ctx.fillStyle = '#ffffff80';      
      ctx.fillRect(18, 20, 470 * fs / 40, (fs*7/8) * help.text.length);
      ctx.fillStyle = 'black';      
      ctx.font = 'bold ' + fs + 'px Arial';
      ctx.fillText(help.text[0], 26, 20 + fs);
      for (let n = 1 ; n < help.text.length ; n++) {
         let i = n == 1 ? 3 : 1;
         let ch = help.text[n].substring(0, i);
         ctx.font = 'bold ' + (fs*3/4) + 'px Arial';
         let w = ctx.measureText(ch).width;
         ctx.fillText(ch, 38 - w * (n==1 ? .2 : .5), 35 + fs + (fs*7/8) * n);
         ctx.font = (fs * 5/8) + 'px Arial';
         ctx.fillText(help.text[n].substring(i), 53, 35 + fs + (fs*7/8) * n);
      }
   }
},

//isSplash : true,
isSplash : false,

isHelp : false,

text : `\
Hot keys
0-9    Select 3D scene 0-9.
b Toggle blurred region in video.
c Toggle editable code for 3D scene.
d Toggle drawing pad.
f Toggle floaters behind me.
g Grab bg (enables transparency).
h Toggle this help menu.
i Toggle show/hide figures.
l Toggle lightpen (small blue object).
m Hold down to move a sketch.
o Toggle whether figures are opaque.
p Toggle show/hide tracked blue pixels.
r Toggle if 3D scene is shifted right.
s Toggle show/hide 3D scene.
t Toggle my semi-transparency.
T Toggle my total transparency.
u Toggle UFO within blue-plate world.
v Toggle if 3D view is tracking head.
V Toggle show/hide head tracking data.
w Toggle world seen thru blue plate.
\' Convert strokes to a sketch.
, Make pen line thinner.
. Make pen line thicker.
/ Hold down to draw.
; Hold down to interact with a sketch.
\u2193 Smaller text.
\u2191 Larger text.
\u2190 Previous figure.
\u2192 Next figure.
`.split('\n'),

}

