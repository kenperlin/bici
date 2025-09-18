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
