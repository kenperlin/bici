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
