
let help = {

display : ctx => {

   let fontSize = 35;

   if (help.isSplash) {
      ctx.fillStyle = '#ffffff80';
      ctx.fillRect(18, 20, 333 * fontSize / 40, 35 * 1.5);
      ctx.fillStyle = 'black';
      ctx.font = 'bold ' + fontSize + 'px Arial';
      ctx.fillText("For help, type 'h'", 26, 60);
   }

   if (help.isHelp) {
      ctx.fillStyle = '#ffffff80';      
      ctx.fillRect(18, 20, 450 * fontSize / 40, (fontSize*7/8) * help.text.length);
      ctx.fillStyle = 'black';      
      ctx.font = 'bold ' + fontSize + 'px Arial';
      ctx.fillText(help.text[0], 26, 20 + fontSize);
      for (let n = 1 ; n < help.text.length ; n++) {
         let i = n == 1 ? 3 : 1;
         let ch = help.text[n].substring(0, i);
         ctx.font = 'bold ' + (fontSize*3/4) + 'px Arial';
         let w = ctx.measureText(ch).width;
         ctx.fillText(ch, 38 - w * (n==1 ? .2 : .5), 35 + fontSize + (fontSize*7/8) * n);
         ctx.font = (fontSize * 5/8) + 'px Arial';
         ctx.fillText(help.text[n].substring(i), 53, 35 + fontSize + (fontSize*7/8) * n);
      }
   }
},

isSplash : true,

isHelp : false,

text : `\
Hot keys
0-9    Select 3D scene 0-9.
b Toggle blurred region in video.
c Toggle editable code for 3D scene.
f Toggle floaters behind me.
g Grab bg (enables transparency).
h Toggle this help menu.
l Toggle lightpen (small blue object).
m Hold down to move a sketch.
p Toggle showing tracked blue pixels.
s Toggle showing 3D scene.
t Toggle my semi-transparency.
T Toggle my total transparency.
u Toggle UFO within blue-plate world.
v Toggle if 3D view is tracking head.
w Toggle world seen thru blue plate.
\' Convert strokes to a sketch.
, Make pen line thinner.
. Make pen line thicker.
/ Hold down to draw.
; Hold down to interact with a sketch.
`.split('\n'),

}

