function Diagram() {
   let path = [ [-25,0],[0,100],[25,80.5],[50,100],[75,0] ];
   let state = 0, mx = 0, radius = .08;
   this.onDrag = (x,y) => mx = x;
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(9, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      let C0, D0;
      ctx.fillStyle = 'white';
      this.fillRect([-1,-1],[1,1]);

      let x = n => (path[n][0] - 30) / 80;
      let y = n => (50 - path[n][1]) / 80;
      let p = n => [x(n),y(n)];

      let dir = n => normalize(add(normalize(subtract(p(n),p(n-1))),
                                   normalize(subtract(p(n),p(n+1)))));

      switch (state) {
      case 0:
         for (let n = 0 ; n < path.length-1 ; n++) {
	    ctx.strokeStyle = colors[n];
            this.line(p(n), p(n+1));
         }
	 break;
      case 2:
         ctx.strokeStyle = 'black';
         ctx.lineWidth = 6;
         for (let n = 1 ; n < path.length-1 ; n++)
	    this.line(p(n),add(p(n),resize(dir(n),.2)),1);
      case 1:
         ctx.lineWidth = 4;
         for (let n = 0 ; n < path.length-1 ; n++) {
	    ctx.strokeStyle = colors[n];
	    let d = resize(normalize(subtract(p(n+1),p(n))),radius);
	    let e = [-d[1],d[0]];
	    let A = subtract(p(n  ),e), B = add(p(n  ),e),
	        C = subtract(p(n+1),e), D = add(p(n+1),e);
	    this.line(A,B).line(B,D).line(D,C).line(C,A);
	 }
         break;
      case 3:
      case 4:
         ctx.lineWidth = 4;
         for (let n = 0 ; n < path.length-1 ; n++) {
	    ctx.strokeStyle = colors[n];
	    let d = resize(normalize(subtract(p(n+1),p(n))),radius);
	    let e0 = [-d[1],d[0]];
	    let e1 = [-d[1],d[0]];
	    if (n < path.length-2)
	       e1 = resize(dir(n+1),-radius);
	    if (n > 0)
	       e0 = resize(dir(n),radius * (n==path.length-2 ? -1 : 1));
	    let A = subtract(p(n  ),e0), B = add(p(n  ),e0),
	        C = subtract(p(n+1),e1), D = add(p(n+1),e1);
	    this.line(A,B).line(B,D).line(D,C).line(C,A);
	    if (state == 4 && n == 0) {
	       ctx.strokeStyle = 'black';
	       this.line(p(n+1),add(p(n+1),resize(d,4)),1);
	       this.line(p(n+1),add(p(n+1),resize([e1[1],-e1[0],0],4)),1);
	       this.text('A',[-.4,-.90]);
	       this.text('B',[ .0,-.73]);
	       this.text('To adjust line thickness,',[-.05,.9]);
	       this.text('divide by A  B',[-.05,.75]);
	       this.dot([.2,.75],.025);
            }
	 }
         break;
      case 5:
      case 6:
         ctx.lineWidth = 4;
         for (let n = 0 ; n < path.length-1 ; n++) {
	    ctx.strokeStyle = colors[n];
	    let d = resize(normalize(subtract(p(n+1),p(n))),radius);
	    let e0 = [-d[1],d[0]];
	    let e1 = [-d[1],d[0]];
	    if (n < path.length-2) {
	       let a = normalize(subtract(p(n+1),p(n)));
	       let b = normalize(subtract(p(n+2),p(n+1)));
	       let s = dot(a, normalize(add(a,b)));
	       e1 = resize(dir(n+1),-radius/s);
            }
	    if (n > 0) {
	       let a = normalize(subtract(p(n),p(n-1)));
	       let b = normalize(subtract(p(n+1),p(n)));
	       let s = dot(a, normalize(add(a,b)));
	       e0 = resize(dir(n),radius/s * (n==path.length-2 ? -1 : 1));
            }
	    let A = subtract(p(n  ),e0), B = add(p(n  ),e0),
	        C = subtract(p(n+1),e1), D = add(p(n+1),e1);
	    this.line(A,B).line(B,D).line(D,C).line(C,A);
	 }
	 if (state == 6) {
	    ctx.strokeStyle = 'black';
	    this.line([-.90,-.77],[-.50,-.77],1);
	    this.line([ .78,-.77],[ .38,-.77],1);
         }
         break;
      case 7:
      case 8:
      case 9:
         ctx.lineWidth = 4;
         for (let n = 0 ; n < path.length-1 ; n++) {
	    ctx.strokeStyle = colors[n];
	    let d = resize(normalize(subtract(p(n+1),p(n))),radius);
	    let e0 = [-d[1],d[0]];
	    let e1 = [-d[1],d[0]];
	    if (n < path.length-2) {
	       let a = normalize(subtract(p(n+1),p(n)));
	       let b = normalize(subtract(p(n+2),p(n+1)));
	       if (dot(a,b) >= 0) {
	          let s = dot(a, normalize(add(a,b)));
	          e1 = resize(dir(n+1),radius/s);
               }
            }
	    if (n > 0) {
	       let a = normalize(subtract(p(n),p(n-1)));
	       let b = normalize(subtract(p(n+1),p(n)));
	       if (dot(a,b) >= 0) {
	          let s = dot(a, normalize(add(a,b)));
	          e0 = resize(dir(n),radius/s * (n==path.length-2 ? -1 : 1));
               }
            }
	    let A = subtract(p(n  ),e0), B = add(p(n  ),e0),
	        C = subtract(p(n+1),e1), D = add(p(n+1),e1);
	    this.line(A,B).line(B,D).line(D,C).line(C,A);
	    if (state >= 8) {
	       ctx.strokeStyle = 'black';
	       this.line(A,B).line(B,C).line(D,C);
	       if (C0) {
	          this.line(D0, A);
		  if (state >= 9) {
	             ctx.strokeStyle = '#800000';
	             this.line(C0, A);
                  }
               }
	    }
	    C0 = C;
	    D0 = D;
	 }
         break;
      }

      ctx.font = '30px Helvetica';
      ctx.strokeStyle = 'black';
      switch (state) {
      case 0: this.text('Start with path of strokes', [0,.9]); break;
      case 1: this.text('Need to connect segments', [0,.9]); break;
      case 2: this.text('Find dihedral directions', [0,.9]); break;
      case 3: this.text('Need constant line thickness!', [0,.9]); break;
      case 6: this.text('Sharp bends can get spiky.', [0,.9]); break;
      case 7: this.text('We can just square off the ends.', [0,.9]); break;
      case 8: this.text('Since this is a triangle strip,', [0,.9]); break;
      case 9: this.text('the gaps will be covered.', [0,.9]); break;
      }
   }
}

