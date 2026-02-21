
export const helpState = {
  isSplash: false,
  isVisible: false
};

const helpText = `\
Hot keys
\u2193 Smaller text
\u2191 Larger text
M Toggle mediapipe face/hand tracking.
V Toggle head+hands tracking data.
F Toggle gaze-mapped hand tracking
L Toggle large area head tracking.
N Toggle no visible tracking feedback.
H Toggle separate hand avatars.
H Toggle scaling hand avatars.
W Toggle webcam video.
h Toggle this help menu.
`.split("\n");

export function displayHelp(ctx, fontSize) {
  let fs = fontSize * 1.25;
  ctx.save();
  if (helpState.isSplash) {
    ctx.fillStyle = "#ffffff80";
    ctx.fillRect(18, 20, (333 * fs) / 40, 35 * 1.5);
    ctx.fillStyle = "black";
    ctx.font = "bold " + fs + "px Arial";
    ctx.fillText("For help, type 'h'", 26, 60);
  } else if (helpState.isVisible) {
    ctx.fillStyle = "#ffffff80";
    ctx.fillRect(18, 20, (500 * fs) / 40, 0.85 * fs * helpText.length + 5);
    ctx.fillStyle = "black";
    ctx.font = "bold " + fs + "px Arial";
    ctx.fillText(helpText[0], 26, 20 + fs);
    for (let n = 1; n < helpText.length; n++) {
      let i = n == 1 ? 3 : 1;
      let ch = helpText[n].substring(0, i);
      ctx.font = "bold " + (fs * 3) / 4 + "px Arial";
      let w = ctx.measureText(ch).width;
      ctx.fillText(ch, 38 - w * (n == 1 ? 0.2 : 0.5), 35 + fs + 0.85 * fs * n);
      ctx.font = (fs * 5) / 8 + "px Arial";
      ctx.fillText(helpText[n].substring(i), 53, 35 + fs + 0.85 * fs * n);
    }
  }
  ctx.restore();
}

export function toggleHelp() {
   helpState.isVisible = !helpState.isVisible
}
