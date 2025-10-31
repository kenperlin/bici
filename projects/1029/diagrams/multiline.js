function Diagram() {
   let path = [ [0,0],[0,100],[25,75],[50,100],[50,0] ];
   let state = 0, mx = 0, radius = .07;
   this.onDrag = (x,y) => mx = x;
   this.onUp = (x,y) => {
      if (y > .5)
         state = Math.max(0, Math.min(9, x > 0 ? state+1 : state-1));
   }
   this.update = ctx => {
      let C0, D0;
      this.fillColor('white');
      this.fillRect([-1,-1],[1,1]);

      let x = n => (path[n][0] - 30) / 80;
      let y = n => (50 - path[n][1]) / 80;
      let p = n => [x(n),y(n)];

      let dir = n => normalize(add(normalize(subtract(p(n),p(n-1))),
                                   normalize(subtract(p(n),p(n+1)))));

      switch (state) {
      case 0:
         for (let n = 0 ; n < path.length-1 ; n++) {
	    this.drawColor(colors[n]);
            this.line(p(n), p(n+1));
         }
	 break;
      case 2:
         this.drawColor('black');
         this.lineWidth(.024);
         for (let n = 1 ; n < path.length-1 ; n++)
	    this.line(p(n),add(p(n),resize(dir(n),.2)),1);
      case 1:
         this.lineWidth(.016);
         for (let n = 0 ; n < path.length-1 ; n++) {
	    this.drawColor(colors[n]);
	    let d = resize(normalize(subtract(p(n+1),p(n))),radius);
	    let e = [-d[1],d[0]];
	    let A = subtract(p(n  ),e), B = add(p(n  ),e),
	        C = subtract(p(n+1),e), D = add(p(n+1),e);
	    this.line(A,B).line(B,D).line(D,C).line(C,A);
	 }
         break;
      case 3:
      case 4:
         this.lineWidth(.016);
         for (let n = 0 ; n < path.length-1 ; n++) {
	    this.drawColor(colors[n]);
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

	       this.drawColor('black');
	       let E = add(A,resize(e0,-4));
	       let F = add(C,resize(e1,-4));
	       this.line(A,E,1);
	       this.line(C,F,1);
	       this.text('A',add(E,[-.07,.01]));
	       this.text('B',add(F,[-.07,0]));

	       this.text('divide by A  B',[-.05,.75]);
	       this.dot([.2,.75],.025);
            }
	 }
         break;
      case 5:
      case 6:
         this.lineWidth(.016);
         for (let n = 0 ; n < path.length-1 ; n++) {
	    this.drawColor(colors[n]);
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
	    this.drawColor('black');
	    this.line([-.90,-.77],[-.50,-.77],1);
	    this.line([ .78,-.77],[ .38,-.77],1);
         }
         break;
      case 7:
      case 8:
      case 9:
         this.lineWidth(.016);
         for (let n = 0 ; n < path.length-1 ; n++) {
	    this.drawColor(colors[n]);
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
	       this.drawColor('black');
	       this.line(A,B).line(B,C).line(D,C);
	       if (C0) {
	          this.line(D0, A);
		  if (state >= 9) {
	             this.drawColor('#800000');
	             this.line(C0, A);
                  }
               }
	    }
	    C0 = C;
	    D0 = D;
	 }
         break;
      }

      this.font('30px Helvetica');
      this.drawColor('black');
      switch (state) {
      case 0: this.text('Add thickness to a multi-line path.', [0,.9]); break;
      case 1: this.text('Need to connect segments', [0,.9]); break;
      case 2: this.text('Find dihedral directions', [0,.9]); break;
      case 3: this.text('Need constant line thickness!', [0,.9]); break;
      case 4: this.text('To adjust line thickness,',[-.05,.9]); break;
      case 6: this.text('Sharp bends can get too spiky.', [0,.9]); break;
      case 7: this.text('We can just square off the ends.', [0,.9]); break;
      case 8: this.text('Since this is a triangle strip,', [0,.9]); break;
      case 9: this.text('the gaps will be covered.', [0,.9]); break;
      }
   }
}

