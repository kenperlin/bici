import { defaultVertexShader, defaultFragmentShader } from './shader.js'

export const noiseCode = `
vec3  _s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float _t(vec3 i, vec3 u, vec3 a) { return dot(normalize(_s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;
export const phongCode = `
vec3 phong(vec3 N, vec3 L, vec3 W, vec3 diffuse, vec4 specular) {
   vec3 R = 2. * N * dot(N,L) - L;
   return diffuse      * max(0., dot(N, L)) +
          specular.rgb * pow(max(0.,dot(R,-W)), specular.a);
}
`;

let animate = () => {};
let gl;
let intervalID, autodraw = true;
let vertexSize = 8;
let mesh = {
  triangle_strip: true,
  data: new Float32Array([
    -1, 1,0, 0,0,1, 0,0,
    1, 1,0, 0,0,1, 0,0,
    -1,-1,0, 0,0,1, 0,0,
    1,-1,0, 0,0,1, 0,0,
  ])
};

export function addTexture(index, src) {
  let image = new Image();
  image.onload = () => {
    gl.activeTexture(gl.TEXTURE0 + index);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
  };
  image.src =
    src.indexOf("/") >= 0 ? src : "projects/" + project + "/images/" + src;
};

export function gl_start(canvas, scene) {
  gl = canvas.getContext("webgl2")
  canvas.gl = gl;
  canvas.setShaders = function (vertexShader, fragmentShader) {
    gl.program = gl.createProgram();
    function addshader(type, src) {
      let shader = gl.createShader(type);
      gl.shaderSource(shader, src);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
        console.log("Cannot compile shader:", gl.getShaderInfoLog(shader));
      gl.attachShader(gl.program, shader);
    }

    addshader(gl.VERTEX_SHADER, vertexShader);

    let i = fragmentShader.indexOf("float") + 6;
    addshader(
      gl.FRAGMENT_SHADER,
      fragmentShader.substring(0, i) +
        noiseCode +
        phongCode +
        fragmentShader.substring(i)
    );

    gl.linkProgram(gl.program);
    if (!gl.getProgramParameter(gl.program, gl.LINK_STATUS))
      console.log("Could not link the shader program!");
    gl.useProgram(gl.program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    vertexMap(["aPos", 3, "aNor", 3, "aUV", 2]);
    setUniform("1i", "uTexture", -1);
    setUniform(
      "1iv",
      "uSampler",
      [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]
    );
  };
  canvas.setShaders(scene.vertexShader ?? defaultVertexShader, scene.fragmentShader ?? defaultFragmentShader);
  //addTexture(15, 'core/images/fixed-width-font.png');
  addTexture(15, "core/images/font.png");
  if (intervalID) clearInterval(intervalID);
  intervalID = setInterval(function () {
    animate();
    if (autodraw) drawMesh(mesh);
  }, 10);
}

export function vertexMap (map) {
  let vertexAttribute = (name, size, position) => {
    let attr = gl.getAttribLocation(gl.program, name);
    gl.enableVertexAttribArray(attr);
    gl.vertexAttribPointer(
      attr,
      size,
      gl.FLOAT,
      false,
      vertexSize * 4,
      position * 4
    );
  };
  vertexSize = 0;
  for (let n = 0; n < map.length; n += 2) vertexSize += map[n + 1];
  let index = 0;
  for (let n = 0; n < map.length; n += 2) {
    vertexAttribute(map[n], map[n + 1], index);
    index += map[n + 1];
  }
};

export function drawMesh(mesh) {
  gl.bufferData(gl.ARRAY_BUFFER, mesh.data, gl.STATIC_DRAW);
  gl.drawArrays(
    mesh.triangle_strip ? gl.TRIANGLE_STRIP : gl.TRIANGLES,
    0,
    mesh.data.length / vertexSize
  );
};

export function drawObj(mesh, matrix, color) {
  if (Array.isArray(mesh))
    for (let n = 0; n < mesh.length; n++)
      drawObj(
        mesh[n].mesh,
        mxm(matrix, mesh[n].matrix ?? identity()),
        color ?? mesh[n].color
      );
  else {
    autodraw = false;
    let m = mxm(perspective(0, 0, -0.5), matrix);
    setUniform("Matrix4fv", "uMF", false, m);
    setUniform("Matrix4fv", "uMI", false, inverse(m));
    setUniform("3fv", "uColor", color ?? mesh.color ?? [1, 1, 1]);
    setUniform("1i", "uTexture", mesh.textureID ?? -1);
    drawMesh(mesh);
    setUniform("1i", "uTexture", -1);
  }
};

export function setUniform (type, name, a, b, c) {
  gl["uniform" + type](gl.getUniformLocation(gl.program, name), a, b, c);
}
