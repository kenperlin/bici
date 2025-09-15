/*
   Use the 640x480 video feed image to track the user's head.
   This algorithm assumes that the wall behind the head is white.
   Return value is [x,y,z] position of the head.

   Approach:
      Find the top of the head.
      Find the left and right edges of the head.
      From those three values, derive the x,y,z positio of the head.
*/

let trackHead = (data, isShowingTracking) => {

   let highlightRect = (col, row, w, h) => {
      for (let x = col>>0 ; x <= col+w>>0 ; x++)
      for (let y = row>>0 ; y <= row+w>>0 ; y++)
         data[xy_to_n(x,y)] /= 2;
   }

   let top = 0, left = 120, right = 520;

   let xy_to_n = (x, y) => 640 * y + x << 2;

   let isWall = (x, y) => {
      let n = xy_to_n(x, y);
      let r = data[n], g = data[n+1], b = data[n+2];
      return r + g + b > 450 && Math.max(r,g,b) < 1.4 * Math.min(r,g,b);
   }

   for (let count = 0 ; top < 120 && count < 10 ; top++)
      for (let x = 120 ; x < 520 ; x++)
         if (! isWall(x, top))
	    count++;

   for (let count = 0 ; left < 520 && count < 10 ; left++)
      for (let y = top ; y < 180 ; y++)
         if (! isWall(left, y))
	    count++;

   for (let count = 0 ; right > 120 && count < 10 ; right--)
      for (let y = top ; y < 180 ; y++)
         if (! isWall(right, y))
	    count++;

   let headY = top + (right - left) * .8;
   let headX = (left + right) / 2;
   let headS = (right - left) / 2;

   if (isShowingTracking)
      highlightRect(headX - headS, top, 2 * headS, 2 * headS);

   return [ 10 * (headX - 320) / 640,
            10 * (240 - headY) / 480,
	    480 / headS ];
}

