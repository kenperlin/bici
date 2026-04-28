let dictionary = {

foo:
   [
      { text: 'foo', pos: [0,0] },
      [ [-.5,-.5], [-.5, .5], [ .5, .5] ],
   ],

x: t => {
      let s = .5 * Math.sin(t);
      return [
         { text: 'hello', pos: [0,.5+.2*s] },
         [ [-s,-.5], [ s,.5] ],
         [ [ s,-.5], [-s,.5] ]
      ];
   },

track: (t,p,pressed) => {
   let x = p[0], y = p[1];
   if (pressed)
      return [
         [ [ -1, y], [ 1, y] ],
         [ [ x, -1], [ x, 1] ],
      ];
      else
         return [
            [ [ x-.1, y ], [ x+.1, y ] ],
 	    [ [ x, y-.1 ], [ x, y+.1 ] ],
	 ];
   },

bar: 'Here is the text\nfor the word "bar".',

};

