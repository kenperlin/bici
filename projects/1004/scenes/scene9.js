/***************************************************

The Phong reflectance model has 3 components:

1) The RGB ambient component is independent of any
given light source.

2) The RGB diffuse component is summed over all
the light sources. For each light source, it is
tinted by the color of that light source, and
varies as:

   diffuse_color * max(0,N•L)

where N is the surface normal, and L is the
direction toward the light source.

3) The RGBP specular (highlight) component, like the
diffuse component, is summed over all the light
sources, and is tinted by the color of that light
source. It requires computing the mirror reflection
direction of the light source:

   R = 2 * N * (N•L) - L

Then you need to compute how closely that reflection
direction is aligned with the highlight direction,
which is the direction of the ray going from the
surface back to the viewpoint:

   highlight_dir = max(0,-(R•W))

Finally, we raise to the specular power, and then
multiply by the specular color:

   specular_color * pow(highlight_dir,specular_power)

The final color is then given by summing all of the
components:

   ambient_color
      +
   sum_over_all_lights (
      light_i_color * (
         diffuse_color_from_light_i
	             +
         specular_color_from_light_i
      )
   )

***************************************************/

function Scene() {

let NS = 1;
let NL = 2;

this.vertexShader = `\
#version 300 es
in  vec3 aPos;
out vec3 vPos;
void main() {
   gl_Position = vec4(aPos, 1.);
   vPos = aPos;
}`;

this.fragmentShader = `\
#version 300 es
precision highp float;
uniform float uTime;
uniform vec3 uViewPoint;

uniform vec3 uC[`+NS+`],
             uAmbient[`+NS+`],
	     uDiffuse[`+NS+`],
             uL[`+NL+`],
	     uLC[`+NL+`];

uniform vec4 uS[`+NS+`],
             uSpecular[`+NS+`];

in  vec3 vPos;
out vec4 fragColor;

vec2 raySphere(vec3 V, vec3 W, vec4 S) {
   V -= S.xyz;
   float b = dot(V, W);
   float d = b * b - dot(V, V) + S.w * S.w;
   if (d < 0.)
      return vec2(1001.,1000.);
   return vec2(-b - sqrt(d), -b + sqrt(d));
}

/*
vec3 phong(vec3 N, vec3 L, vec3 W,
           vec3 diffuse, vec4 specular) {

   // YOUR CODE GOES HERE.
}
*/

vec3 shadeSphere(vec4 S, vec3 P, vec3 W,
                 vec3 ambient,
                 vec3 diffuse,
		 vec4 specular) {
   vec3 N = (P - S.xyz) / S.w;
   vec3 shade = ambient;
   for (int l = 0 ; l < `+NL+` ; l++)
      shade += uLC[l] * phong(N, uL[l], W,
			      diffuse,
			      specular);
   return shade;
}

void main() {
   vec4 F = vec4(0.);
   vec3 V = uViewPoint;
   vec3 W = normalize(vPos-V);
   float t = 100.;

   for (int i = 0 ; i < `+NS+` ; i++) {
      vec2 tt = raySphere(V, W, uS[i]);
      if (tt.x < tt.y && tt.x > 0. && tt.x < t) {
         t = tt.x;
	 vec3 P = V + t * W;
         F = vec4(shadeSphere(uS[i], P, W,
	                      uAmbient[i],
			      uDiffuse[i],
			      uSpecular[i]), 1.);
      }
   }

   fragColor = vec4(sqrt(F.rgb), F.a);
}`;

let startTime = Date.now()/1000;

let normalize = v => {
   let s = Math.sqrt(v[0]*v[0]+v[1]*v[1]+v[2]*v[2]);
   return [ v[0]/s, v[1]/s, v[2]/s ];
}

this.update = viewPoint => {
   let time = Date.now()/1000 - startTime;
   setUniform('1f', 'uTime', time);
   setUniform('3fv', 'uViewPoint', viewPoint);

   setUniform('4fv', 'uS', [ 0,0,0,.4 ]);

   setUniform('3fv', 'uAmbient', [ 0,0,.1 ]);
   setUniform('3fv', 'uDiffuse', [ 0,0,1 ]);
   setUniform('4fv', 'uSpecular', [ 1,1,1,20 ]);

   setUniform('3fv', 'uL', [
      normalize([(_.x ?? -.35),
                 (_.y ??  .35), .35]),
      normalize([1,-1,-.5]),
   ].flat());

   setUniform('3fv', 'uLC', [ .5,.7,1,
                              .2,.15,.1,
			    ]);
}

}


