export const videoState = {
  x: 0,
  y: 0,
  w: window.innerWidth,
  h: window.innerHeight,
  isVisible: false,
}

export function drawVideoToCover(ctx, src, isFlipped) {
  const canvasAspect = WIDTH / HEIGHT;
  const videoAspect = src.videoWidth / src.videoHeight;

  if (videoAspect > canvasAspect) {
    videoState.w = HEIGHT * videoAspect;
    videoState.h = HEIGHT;
    videoState.x = (WIDTH - videoState.w) / 2;
    videoState.y = 0;
  } else {
    videoState.w = WIDTH;
    videoState.h = WIDTH / videoAspect;
    videoState.x = 0;
    videoState.y = (HEIGHT - videoState.h) / 2;
  }

  if(!videoState.isVisible) {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    return;
  }

  ctx.save();
  if(isFlipped) {
    ctx.translate(WIDTH, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(src, videoState.x, videoState.y, videoState.w, videoState.h);
  ctx.restore();
}
