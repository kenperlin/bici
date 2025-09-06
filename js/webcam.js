let webcam = document.createElement('video');
webcam.autoplay = true;
webcam.style.position = 'absolute';
webcam.style.top = '-2000px';
navigator.mediaDevices.getUserMedia({ audio: false, video: true })
         .then(function(stream) { webcam.srcObject = stream; },
               function(error ) { console.log(error); });

webcam.canvas = document.createElement('canvas');
webcam.canvas.style.position = 'absolute';
webcam.canvas.style.left = '2000px';
webcam.canvas.width = 640;
webcam.canvas.height = 480;
let wctx = webcam.canvas.getContext('2d');

// HANDLE IMAGE LOADING

let loadImageCanvas = document.createElement('canvas');
loadImageCanvas.style.position = 'absolute';
loadImageCanvas.style.left = '2000px';
loadImageCanvas.width = 640;
loadImageCanvas.height = 480;
let lictx = loadImageCanvas.getContext('2d');

let loadImage = src => {
   let image = new Image(), data;
   image.onload = () => {
      lictx.drawImage(image, 0,0);
      image.data = lictx.getImageData(0,0,image.width,image.height).data;
   }
   image.src = 'imgs/' + src;
   return image;
}
let brick = loadImage('brick.png');
let landscape = loadImage('landscape.png');
let ufo = loadImage('ufo.png');

// CAPTURE BACKGROUND TO PREPARE FOR TRANSPARENCY

webcam.captureBG = () => webcam.bg = webcam.data;

webcam.isPen = true;
webcam.opacity = 1;
webcam._op = 1;

webcam.update = () => {
   let time = (Date.now() - webcam.T) / 1000;
   let deltaTime = time - (webcam._time ?? time);
   webcam._time = time;

   let fade = (a,b,d) => a = (a??b) == b ? b : a < b ? Math.min(b,a+d) : Math.max(b,a-d);
   let ease = t => t * t * (3 - t - t);
   let mix = (a,b,t) => a + t * (b - a);

   let getAvg = data => {
      let r = 0, g = 0, b = 0, s = 0;
      for (let row = 0 ; row < 20 ; row++)
      for (let col = 0 ; col < 640 ; col++) {
         let n = 640 * row + col << 2;
         r += data[n];
         g += data[n+1];
         b += data[n+2];
         s++;
      }
      return [r/s, g/s, b/s];
   }

   // GET THIS FRAME OF VIDEO AS AN RGBA BYTE ARRAY

   wctx.drawImage(webcam, 0, 0, 640, 480);
   let imgData = wctx.getImageData(0,0,640,480);
   let data = imgData.data;
   webcam.data = data;

   // REVERSE THE VIDEO IMAGE LEFT/RIGHT

   for (let row = 0 ; row < 480 ; row++)
   for (let col = 0 ; col < 320 ; col++) {
      let n0 = 640 * row +      col  << 2;
      let n1 = 640 * row + (639-col) << 2;
      for (let i = 0 ; i < 3 ; i++) {
         let swap   = data[n0+i];
         data[n0+i] = data[n1+i];
         data[n1+i] = swap;
      }
   }

   // FOLLOW THE POSITION OF A BLUE MARKER PEN

   let xs = 0, ys = 0, ns = 0;
   for (let row = 0, n = 0 ; row < 480 ; row++)
   for (let col = 0 ; col < 640 ; col++, n += 4) {
      let r = data[n], g = data[n+1], b = data[n+2];
      if (b > 64 && b > 1.3 * Math.max(r,g)) {
	 if (webcam.isPen)
            data[n] = data[n+1] = data[n+2] = 0;
	 xs += col;
	 ys += row;
	 ns++;
      }
   }

   // SEE THROUGH A BLUE PLATE INTO A MYSTEROUS OTHER WORLD

   webcam._iw = fade(webcam._iw, webcam.isWorld ? 1 : 0, deltaTime / .5);

   if (webcam._iw && ns > 20) {
      let uw = ufo.width, uh = ufo.height;
      let L = landscape.data;
      let x = xs / ns;
      let y = ys / ns;
      let time = Date.now() / 1000 - (webcam.ufoTime ?? 0);
      for (let row = 0, n = 0 ; row < 480 ; row++)
      for (let col = 0 ; col < 640 ; col++, n += 4) {
         let r = data[n], g = data[n+1], b = data[n+2];
         if (b > 64 && b > 1.3 * Math.max(r,g)) {
	    let rr = 4 * ( (col-x) * (col-x) + (row-y) * (row-y) );
	    let t = mix(1, rr / ns, webcam._iw);
	    if (t < 1) {
	       let D = [L[n],L[n+1],L[n+2]];

	       // AND OPTIONALLY ADD A FLYING SAUCER

	       if (webcam.ufoTime) {
	          let ux = (col + 160 * time) % 640;
	          let uy = row - 150 + (20 * Math.sin(2.5 * time) >> 0);
	          if (ux >= 0 && ux < uw && uy >= 0 && uy < uh) {
	             let un = uw * uy + ux << 2;
	             let u = Math.min(1, ufo.data[un+2] / 100);
	             for (let i = 0 ; i < 3 ; i++)
                        D[i] = D[i] * (1-u) + ufo.data[un+i] * u;
                  }
               }
	       for (let i = 0 ; i < 3 ; i++)
                  data[n+i] = t * data[n+i] + (1-t) * D[i];
            }
         }
      }
   }

   // OPTIONAL FOREGROUND TRANSPARENCY FADE DOWN AND FADE UP

   webcam._op = fade(webcam._op, webcam.opacity, deltaTime / 2);

   if (webcam._op < 1 && webcam.bg) {
      let t = webcam._op;
      t = t * t * (3 - t - t);
      let avg0 = getAvg(webcam.bg);
      let avg1 = getAvg(data);
      for (let n = 0 ; n < data.length ; n += 4)
         for (let i = 0 ; i < 3 ; i++)
            data[n+i] = t * data[n+i] + (1-t) * webcam.bg[n+i] * avg1[i] / avg0[i];
   }

   // OPTIONALLY REPLACE SECTIONS OF THE WHITE WALL BEHIND ME BY VARIOUS IMAGES

   if (webcam.isFloaters) {
      for (let n = 0 ; n < data.length ; n += 4) {
         let r = data[n], g = data[n+1], b = data[n+2];
	 if (r + g + b > webcam.A && Math.max(r,g,b) < webcam.B / 100 * Math.min(r,g,b)) {
	    let y = (n>>2) / 640 >> 0;
	    let x = (n>>2) % 640;
	    if (y >= 140-80 && y <= 140+80 && x >= 120 && x <= 640 - 120) {
	       let x = (64000000 + n - 300 * time >> 2) % 640;
	       if (x >= 105-80 && x <= 105+80) {
                  data[n  ] *= 2;
                  data[n+1] /= 2;                  // TRANSPARENT RED GEL
                  data[n+2] /= 2;
               }
	       if (x >= 320-80 && x <= 320+80) {
	          let nb = brick.width * (y-60) + (x - 80) << 2;
                  data[n  ] = brick.data[nb  ];
                  data[n+1] = brick.data[nb+1];    // SECTION OF A BRICK WALL
                  data[n+2] = brick.data[nb+2];
               }
	       if (x >= 535-80 && x <= 535+80) {
                  data[n  ] /= 2;
                  data[n+1] /= 2;                  // TRANSPARENT BLUE GEL
                  data[n+2] *= 2;
               }
            }
         }
      }
   }

   wctx.putImageData(imgData, 0,0);

   return ns > 20 ? {x: xs/ns, y: ys/ns} : null;
}

webcam.A = 450;
webcam.B = 130;
webcam.T = Date.now();

