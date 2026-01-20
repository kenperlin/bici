export function centeredText(ctx, text, x, y) {
  ctx.fillText(text, x - ctx.measureText(text).width / 2, y);
}

export function screenText(ctx, text) {
  ctx.save();
  ctx.font = '30px Courier';
  ctx.fillStyle = 'black';
  centeredText(ctx, text, WIDTH / 2, 30);
  ctx.restore();
}

export function drawVideoToCover(ctx, src, targetW, targetH) {
  const canvasAspect = targetW / targetH;
  const videoAspect = src.videoWidth / src.videoHeight;

  let x, y, w, h;
  if (videoAspect > canvasAspect) {
    w = targetH * videoAspect;
    h = targetH;
    x = (targetW - w) / 2;
    y = 0;
  } else {
    w = targetW;
    h = targetW / videoAspect;
    x = 0;
    y = (targetH - h) / 2;
  }

  ctx.drawImage(src, x, y, w, h);
}
