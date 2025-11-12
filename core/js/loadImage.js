let loadImageCanvas = document.createElement('canvas');
loadImageCanvas.style.position = 'absolute';
loadImageCanvas.style.left = '2000px';
loadImageCanvas.width = 640;
loadImageCanvas.height = 480;
let lictx = loadImageCanvas.getContext('2d');

let loadImage = (src, callback) => {
   let image = new Image(), data;
   let onload = image => {
      lictx.drawImage(image, 0,0);
      image.data = lictx.getImageData(0,0,image.width,image.height).data;
      callback(image);
   }
   image.onload = () => onload(image);
   if (src.indexOf('/') == -1)
      src = 'projects/' + project + '/images/' + src;
   image.src = src;
   image.onerror = err => console.log('image', src, 'not found');
}
