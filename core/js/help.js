
let help = {

display : ctx => {

   let fs = fontSize * 1.37;

   if (help.isSplash) {
      ctx.fillStyle = '#ffffff80';
      ctx.fillRect(18, 20, 333 * fs / 40, 35 * 1.5);
      ctx.fillStyle = 'black';
      ctx.font = 'bold ' + fs + 'px Arial';
      ctx.fillText("For help, type 'h'", 26, 60);
   }

   if (help.isHelp) {
      ctx.fillStyle = '#ffffff80';      
      ctx.fillRect(18, 20, 500 * fs / 40, .85 * fs * help.text.length + 5);
      ctx.fillStyle = 'black';      
      ctx.font = 'bold ' + fs + 'px Arial';
      ctx.fillText(help.text[0], 26, 20 + fs);
      for (let n = 1 ; n < help.text.length ; n++) {
         let i = n == 1 ? 3 : 1;
         let ch = help.text[n].substring(0, i);
         ctx.font = 'bold ' + (fs*3/4) + 'px Arial';
         let w = ctx.measureText(ch).width;
         ctx.fillText(ch, 38 - w * (n==1 ? .2 : .5), 35 + fs + .85 * fs * n);
         ctx.font = (fs * 5/8) + 'px Arial';
         ctx.fillText(help.text[n].substring(i), 53, 35 + fs + .85 * fs * n);
      }
   }
},

isSplash : false,
isHelp : false,

text : `\
Hot keys
0-9    Select 3D scene 0-9.
a (+ key) Open a pre-defined URL.
b Toggle blurred region in video.
c Toggle editable code for 3D scene.
d Toggle drawing pad.
e (+ key) Show src code in text editor.
f Toggle floaters behind me.
g Grab bg (enables transparency).
h Toggle this help menu.
i Toggle show/hide slides.
j (+ key) Jump to a particular slide.
l Toggle lightpen (small blue object).
L Toggle large area head tracking.
m Hold down to move a sketch.
M Toggle mediapipe face/hand tracking.
N Toggle no visible tracking feedback.
o Toggle whether slides are opaque.
p Toggle show/hide tracked blue pixels.
r Toggle if 3D scene is shifted right.
s Toggle show/hide 3D scene.
t Toggle my semi-transparency.
T Toggle my total transparency.
u Toggle UFO within blue-plate world.
v Toggle if 3D view is tracking head.
V Toggle head+hands tracking data.
x Copy clipboard buffer to the console.
w Toggle world seen thru blue plate.
z Toggle freeze tracked head position.
\' Convert strokes to a sketch.
, Make pen line thinner.
. Make pen line thicker.
[ Red pen.
] Blue pen.
\\ Black pen.
/ Hold down to draw.
; Hold down to interact with a sketch.
\u2193 Smaller text.
\u2191 Larger text.
\u2190 Previous slide.
\u2192 Next slide.
`.split('\n'),

}

