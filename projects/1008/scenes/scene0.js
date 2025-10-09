// MINIMAL STUB SCENE
function Scene() {
this.vertexShader = `#version 300 es void main(){gl_Position=vec4(0.);}`;
this.fragmentShader=`#version 300 es precision highp float;out vec4 f;void main(){f=vec4(0.);}`;
this.update = () => {}
}

