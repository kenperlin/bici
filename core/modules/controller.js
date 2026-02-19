export class InteractionController {
  constructor({ codeArea, slideManager, sceneManager, pen }) {
    this.codeArea = codeArea;
    this.slideManager = slideManager;
    this.sceneManager = sceneManager;
    this.pen = pen;

    this.activeTargets = new Map();

    window.addEventListener("mousemove", (e) => {
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
    targetId ??= this.getTargetIdFromPosition(x, y);
    const pointerTarget = this.getPointerTarget(targetId);
    
    if (pointerTarget?.onDown) {
      this.activeTargets.set(id, targetId);
      pointerTarget.onDown(x, y, z, id);
      return true;
    }
    return false;
  }

  triggerMove(id, x, y, z, targetId) {
    targetId ??= this.activeTargets.get(id);
    const pointerTarget = this.getPointerTarget(targetId);

    if(pointerTarget?.onMove) {
      pointerTarget.onMove(x, y, z, id);
      return true;
    }
    return false;
  }

  triggerUp(id, x, y, z, targetId) {
    targetId ??= this.activeTargets.get(id);
    const pointerTarget = this.getPointerTarget(targetId);
    
    if (pointerTarget?.onUp) { 
      pointerTarget.onUp(x, y, z, id);
      this.activeTargets.delete(id);
      return true;
    }
    return false;
  }

  toggleVisible(targetId) {
    const target = this.getTarget(targetId)
    if(target) {
      console.log(`Toggling visible for target ${targetId}`)
      target.toggleVisible()
    }
  }

  getTargetIdFromPosition(x, y) {
    if (this.codeArea.isVisible && this.codeArea.contains(x, y)) return "code";
    if (this.sceneManager.isVisible && this.sceneManager.canvas.contains(x, y)) return "scene";
    if (this.slideManager.isVisible && this.slideManager.canvas.contains(x, y)) return "slide";
    return null;
  }

  getActiveTargetId() {
    switch(document.activeElement) {
      case this.codeArea.element: return "code";
      case this.sceneManager.canvas.element: return "scene";
      case this.slideManager.canvas.element: return "slide";
    }
  }

  getTarget(targetId) {
    switch (targetId) {
      case "code":
        return this.codeArea;
      case "scene":
        return this.sceneManager;
      case "slide":
        return this.slideManager;
    }
    return null;
  }

  getPointerTarget(targetId) {
    switch (targetId) {
      case "code":
        return this.codeArea;
      case "scene":
        return this.sceneManager.canvas;
      case "slide":
        return this.slideManager.canvas;
    }
    return null;
  }
}
