export class InteractionController {
  constructor({ codeArea, slideManager, sceneManager, pen }) {
    this.codeArea = codeArea;
    this.slideManager = slideManager;
    this.sceneManager = sceneManager;
    this.pen = pen;

    this.mouseX = 0;
    this.mouseY = 0;
    this.activeTargets = new Map();

    window.addEventListener("mousemove", (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
      this.triggerMove("/", e.clientX, e.clientY, 0);
      this.triggerMove("mouse", e.clientX, e.clientY, 0);
    });
    window.addEventListener("mousedown", (e) => {
      this.triggerDown("mouse", e.clientX, e.clientY, 0);
    });
    window.addEventListener("mouseup", (e) => {
      this.triggerUp("mouse", e.clientX, e.clientY, 0);
    });
  }

  triggerDown(id, x, y, z, targetId) {
    x ??= this.mouseX;
    y ??= this.mouseY;
    targetId ??= this.getTargetIdFromPosition(x, y);
    const pointerTarget = this.getTarget(targetId);

    if(targetId === "pen" && id !== "/") return false;
    if(!pointerTarget?.onDown) return false;

    this.activeTargets.set(id, targetId);
    pointerTarget.onDown(x, y, z, id);
    return true;
  }

  triggerMove(id, x, y, z, targetId) {
    x ??= this.mouseX;
    y ??= this.mouseY;
    targetId ??= this.activeTargets.get(id);
    const pointerTarget = this.getTarget(targetId);

    if(!pointerTarget?.onMove) return false;

    pointerTarget.onMove(x, y, z, id);
    return true;
  }

  triggerUp(id, x, y, z, targetId) {
    x ??= this.mouseX;
    y ??= this.mouseY;
    targetId ??= this.activeTargets.get(id);
    const pointerTarget = this.getTarget(targetId);

    if(!pointerTarget?.onUp) return false;

    pointerTarget.onUp(x, y, z, id);
    this.activeTargets.delete(id);
    return true;
  }

  triggerAutofocus(targetId, autofocusFn) {
    const target = this.getTarget(targetId);
    const shouldFocus = target.contains(this.mouseX, this.mouseY) || autofocusFn(target)

    if (shouldFocus) {
      if (document.activeElement !== target.element) target.element.focus();
      return target;
    } else {
      if (document.activeElement === target.element) target.element.blur();
      return null;
    }
  }

  toggleVisible(targetId) {
    this.getTarget(targetId).toggleVisible?.();
  }
  
  toggleOpaque(targetId) {
    this.getTarget(targetId).toggleOpaque?.();
  }

  getTargetIdFromPosition(x, y) {
    if (this.codeArea.isVisible && this.codeArea.contains(x, y)) return "code";
    if (this.sceneManager.canvas.isVisible && this.sceneManager.canvas.contains(x, y))
      return "scene";
    if (this.slideManager.canvas.isVisible && this.slideManager.canvas.contains(x, y))
      return "slide";
    return "pen";
  }

  getActiveTargetId() {
    switch (document.activeElement) {
      case this.codeArea.element:
        return "code";
      case this.sceneManager.canvas.element:
        return "scene";
      case this.slideManager.canvas.element:
        return "slide";
    }
  }

  getTarget(targetId) {
    switch (targetId) {
      case "code":
        return this.codeArea;
      case "scene":
        return this.sceneManager.canvas;
      case "slide":
        return this.slideManager.canvas;
      case "pen":
        return this.pen;
    }
    return null;
  }
}
