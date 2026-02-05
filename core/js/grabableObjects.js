class GrabableObject {
  // Supports cubic hitboxes for now
  constructor(mesh, color, x, y, z, lx, ly, lz) {
    this.pos = {x: x, y: y, z: z};
    this.bounds = {lx: lx, ly: ly, lz: lz};
    // Default scaling and rotations
    this.scale = 1;
    this.aim = identity();
    this.mesh = mesh;
    this.color = color;
  }

  setScale(scale) {
    this.scale = scale;
  }

  drawObject() {
    // ToDo: Replace using matrix stack in utils
    let m = 
      mxm(
        mxm(
          mxm(
            move(this.pos.x * 2 - 1, this.pos.y * 2 - 1, this.pos.z * 2 - 1),
            scale(0.4 + 0.3 * this.pos.z)
          ),
          scale(this.scale)
        ), 
        this.aim
      );

    drawObj(this.mesh, m, this.color);
  }

  getEffectiveSize() {
    const scale = this.scale * (0.4 + 0.3 * this.pos.z);
    return {
      lx: this.bounds.lx * scale,
      ly: this.bounds.ly * scale,
      lz: this.bounds.lz * scale
    }
  }

  isHitting(obj2) {
    const size1 = this.getEffectiveSize();
    const size2 = obj2.getEffectiveSize();

    return this.pos.x - size1.lx/2 < obj2.pos.x + size2.lx/2
      && this.pos.x + size1.lx/2 > obj2.pos.x - size2.lx/2
      && this.pos.y - size1.ly/2 < obj2.pos.y + size2.ly/2
      && this.pos.y + size1.ly/2 > obj2.pos.y - size2.ly/2
      && this.pos.z - size1.lz/2 < obj2.pos.z + size2.lz/2
      && this.pos.z + size1.lz/2 > obj2.pos.z - size2.lz/2;
  }
}

class ObjectTracker {
  constructor() {
    this.objs = [];
    this.currSelection = null;
  }

  addObj(mesh, color, x, y, z, lx, ly, lz) {
    let obj = new GrabableObject(mesh, color, x, y, z, lx, ly, lz);
    this.objs.push(obj);
  }

  drawObjs() {
    for (const obj of this.objs) {
      obj.drawObject();
    }
  }

  onPinch(x, y, z, handedness) {
    if (this.currSelection) {
      return;
    }
    
    for (const obj of this.objs) {
      let dx = Math.abs(obj.pos.x - x);
      let dy = Math.abs(obj.pos.y - y);
      if (norm([dx, dy, 0]) <= 0.3) {
        this.currSelection = {object: obj, hand: handedness}
        break;
      }
    }
  }

  onLeave(handedness) {
    if (this.currSelection?.hand === handedness) {
      this.currSelection = null;
    }
  }

  onDrag(x, y, z, handedness) {
    if (this.currSelection?.hand === handedness) {
      const prevPos = {...this.currSelection.object.pos};
      this.currSelection.object.pos = {x: x, y: y, z: z};
      for (const obj of this.objs) {
        if (obj === this.currSelection.object) {
          continue;
        }
        if (this.currSelection.object.isHitting(obj)) {
          this.currSelection.object.pos = prevPos;
        }
      }
    }
  }

  rescale(vector, otherHand) {
    const holderHand = otherHand == "left" ? "right" : "left";
    if (this.currSelection?.hand === holderHand) {
      this.currSelection.object.scale = 10 * norm(vector);;
    }
  }

  onRotate(rMatrix, otherHand) {
    const holderHand = otherHand == "left" ? "right" : "left";
    if (this.currSelection?.hand === holderHand) {
      this.currSelection.object.aim = rMatrix;
    }
  }
}