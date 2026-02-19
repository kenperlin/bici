export class InteractionController {
  constructor({ codeArea, slideManager, sceneManager, pen }) {
    this._codeArea = codeArea;
    this._slideManager = slideManager;
    this._sceneManager = sceneManager;
    this._pen = pen;

    this.activeTargets = new Map();
  }

  triggerDown(id, x, y, z, targetId) {
    targetId ??= this.targetIdFromPosition(x, y);
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

  targetIdFromPosition(x, y) {
    if (this._codeArea.isVisible && this._codeArea.contains(x, y)) return "code";
    if (this._sceneManager.isVisible && this._sceneManager.canvas.contains(x, y)) return "scene";
    if (this._slideManager.isVisible && this._slideManager.canvas.contains(x, y)) return "slide";
    return null;
  }

  getTarget(targetId) {
    switch (targetId) {
      case "code":
        return this._codeArea;
      case "scene":
        return this._sceneManager;
      case "slide":
        return this._slideManager;
    }
    return null;
  }

  getPointerTarget(targetId) {
    switch (targetId) {
      case "code":
        return this._codeArea;
      case "scene":
        return this._sceneManager.canvas;
      case "slide":
        return this._slideManager.canvas;
    }
    return null;
  }
}
