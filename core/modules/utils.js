export function centeredText(ctx,text,x,y) {
  ctx.fillText(text, x-ctx.measureText(text).width/2, y)
}
