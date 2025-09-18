let noiseCode = `
vec3  _s(vec3 i) { return cos(5.*(i+5.*cos(5.*(i.yzx+5.*cos(5.*(i.zxy+5.*cos(5.*i))))))); }
float _t(vec3 i, vec3 u, vec3 a) { return dot(normalize(_s(i + a)), u - a); }
float noise(vec3 p) {
   vec3 i = floor(p), u = p - i, v = 2.*mix(u*u, u*(2.-u)-.5, step(.5,u));
   return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
              mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                  mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
}`;
function gl_start(canvas, scene) {
   setTimeout(function() {
      canvas.gl = canvas.getContext('webgl2');
      canvas.setShaders = function(vertexShader, fragmentShader) {
         gl = this.gl;
	 gl.program = gl.createProgram();
         function addshader(type, src) {
            let shader = gl.createShader(type);
            gl.shaderSource(shader, src);
            gl.compileShader(shader);
            if (! gl.getShaderParameter(shader, gl.COMPILE_STATUS))
               console.log('Cannot compile shader:', gl.getShaderInfoLog(shader));
            gl.attachShader(gl.program, shader);
         };
         addshader(gl.VERTEX_SHADER, vertexShader);

	 let i = fragmentShader.indexOf('float') + 6;
         addshader(gl.FRAGMENT_SHADER, fragmentShader.substring(0,i) + noiseCode + fragmentShader.substring(i));

         gl.linkProgram(gl.program);
         if (! gl.getProgramParameter(gl.program, gl.LINK_STATUS))
            console.log('Could not link the shader program!');
         gl.useProgram(gl.program);
         gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
         gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,1,0,1,1,0,-1,-1,0,1,-1,0]), gl.STATIC_DRAW);
         let aPos = gl.getAttribLocation(gl.program, 'aPos');
         gl.enableVertexAttribArray(aPos);
         gl.vertexAttribPointer(aPos, 3, gl.FLOAT, false, 0, 0);
      }
      canvas.setShaders(scene.vertexShader, scene.fragmentShader);
      setInterval(function() {
         animate();
         gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      }, 30);
   }, 100);
}
let animate = () => {}
let gl;
let setUniform = (type,name,a,b,c) => (gl['uniform'+type])(gl.getUniformLocation(gl.program,name), a,b,c);

let M=new(M4=function(){let T=this,_=(m,i,j,k,l)=>[m[i],m[j],m[k],m[l]],E=(a,b)=>a!==undefined?a:b?b:0,U=t=>Math.cos(t),V=t=>Math.sin(t),Q=t=>t*t,a,b,c,i,j,k,l,I,J,K,L,r,s,t=0,d=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*E(b[2])+a[3]*E(b[3],1),D=()=>P([1,0,0,0,0,1,0,0,0,0,1,0]),f=a=>m(M(m(),a)),P=a=>a.concat([0,0,0,1]),S=[D()],F=a=>f(P(a)),m=a=>a!==undefined?S[t]=a:S[t],x=m=>_(m,0,1,2,3),y=m=>_(m,4,5,6,7),z=m=>_(m,8,9,10,11),w=m=>_(m,12,13,14,15),v=(m,a)=>[d(x(m),a)/(r=a[3]?d(w(m),a):1),d(y(m),a)/r,d(z(m),a)/r,E(a[3],1)],M=(a,b)=>[d(i=x(a),I=_(b,0,4,8,12)),d(i,J=_(b,1,5,9,13)),d(i,K=_(b,2,6,10,14)),d(i,L=_(b,3,7,11,15)),d(j=y(a),I),d(j,J),d(j,K),d(j,L),d(k=z(a),I),d(k,J),d(k,K),d(K,L),d(l=w(a),I),d(l,J),d(l,K),d(l,L)];T.save=()=>S[t+1]=S[t++];T.restore=()=>--t;T.identity=()=>m(D());T.translate=(x,y,z)=>F([1,0,0,x,0,1,0,y,0,0,1,z]);T.rotateX=a=>F([1,0,0,0,0,c=U(a),-(s=V(a)),0,0,s,c,0]);T.rotateY=a=>F([c=U(a),0,s=V(a),0,0,1,0,0,-s,0,c,0]);T.rotateZ=a=>F([c=U(a),-(s=V(a)),0,0,s,c,0,0,0,0,1,0]);T.scale=(x,y,z)=>F([x,0,0,0,0,E(y,x),0,0,0,0,E(z,x),0]);T.perspective=(x,y,z)=>f([1,0,0,0,0,1,0,0,0,0,1,0,x/(r=x*x+y*y+z*z),y/r,z/r,1]);T.transform=a=>v(m(),a);T.m=()=>m();T.copy=s=>S[t]=s.m().slice()})();

