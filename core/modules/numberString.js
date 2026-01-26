export function findNumberString(s, i1) {
  let c = s.charAt(i1-1);
  if (c >= '0' && c <= '9')
      for (let i0 = i1-1 ; i0 > 0 ; i0--)
  if ('-.0123456789'.indexOf(s.charAt(i0-1)) < 0)
            return s.substring(i0,i1);
  return null;
}
export function increment(s0, sign) {
  let number;
  let d0 = s0.indexOf(".");
  if (d0 < 0) return "" + (parseInt(s0) + sign);

  let incr = sign * 1.0001;
  for (let i = d0 + 1; i < s0.length; i++) incr /= 10;

  let f = parseFloat(s0) + incr;
  if (Math.abs(f) < 0.00001) f = 0;
  let s1 = "" + f;

  if (s1.substring(0, 2) == "0.") s1 = s1.substring(1);

  if (s1.substring(0, 3) == "-0.") s1 = "-" + s1.substring(2);

  let d1 = s1.indexOf(".");
  if (d1 == -1) {
    if (s1 == "0") s1 = "";
    s1 += ".";
    for (let i = d0 + 1; i < s0.length; i++) s1 += "0";
    return s1;
  }

  let dc = s1.length - d1 - (s0.length - d0);
  if (dc > 0) s1 = s1.substring(0, s1.length - dc);
  else if (dc < 0) s1 += "0";

  return s1;
}
