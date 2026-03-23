const mirror = document.getElementById('mirror');

const beforeNode = document.getElementById('before');
const highlightNode = document.getElementById('highlight');
const afterNode = document.getElementById('after');

const range = document.createRange();

function computeRects(textarea, start, end) {
  const text = textarea.value;
  // Only update node values (no DOM rebuild)
  beforeNode.textContent = text.slice(0, start);
  highlightNode.textContent = text.slice(start, end);
  afterNode.textContent = text.slice(end);

  // Move range onto the highlight node
  range.selectNodeContents(highlightNode);

  const rectList = range.getClientRects();
  const mirrorBox = mirror.getBoundingClientRect();

  const scrollLeft = textarea.scrollLeft;
  const scrollTop = textarea.scrollTop;

  const rects = new Array(rectList.length);
  for (let i = 0; i < rectList.length; i++) {
    const r = rectList[i];
    rects[i] = {
      x: r.left - mirrorBox.left - scrollLeft,
      y: r.top - mirrorBox.top - scrollTop,
      width: r.width,
      height: r.height
    };
  }

  return rects;
}

function drawRects(textarea, rects) {

  const boundingRect = textarea.getBoundingClientRect();

  OCTX.save();
  OCTX.fillStyle = 'rgba(255,255,0,0.5)';
  OCTX.translate(boundingRect.left, boundingRect.top)
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i];
    OCTX.fillRect(r.x, r.y, r.width, r.height);
  }
  OCTX.restore();
}

export function highlightRange(textarea, start, end) {
  if (start === end) {
    return;
  }

  const rects = computeRects(textarea, start, end);
  drawRects(textarea, rects);
}
