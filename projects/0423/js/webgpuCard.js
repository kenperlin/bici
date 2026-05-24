function WebgpuCard(ctx) {

   let xy = [0,0], mouseDown = false;
   this.mousePress   = pos => { xy = pos; mouseDown = true; };
   this.mouseDrag    = pos => { xy = pos; };
   this.mouseRelease = pos => { xy = pos; mouseDown = false; };
   this.mouseClick   = pos => { xy = pos; };

   let canvas = document.createElement('canvas');
   canvas.width = canvas.height = 500;
   document.body.appendChild(canvas);

   let context = canvas.getContext('webgpu');
   let format  = navigator.gpu.getPreferredCanvasFormat();
   let adapter, device, rP, uB, bG, okToDraw, startTime = Date.now() / 1000;
   let oldShader = 'rgb = vec3(0,0,1);', badShader;
   let T = [];

   this.setShader = newShader => {
      if (newShader == oldShader || newShader == badShader)
         return;

      async function init(shader) {
         shaderCode = `

            // WEBGPU IMPLEMENTATION OF MY HANDY DANDY NOISE AND TURBULENCE FUNCTIONS

            fn _s(i: vec3f) -> vec3f { return cos(5*(i+5*cos(5*(i.yzx+5*cos(5*(i.zxy+5*cos(5*i))))))); }
            fn _t(i: vec3f, u: vec3f, a: vec3f) -> f32 { return dot(normalize(_s(i + a)), u - a); }
            fn noise(p: vec3f) -> f32 {
               let i = floor(p);
               let u = p - i;
               let v = 2.*mix(u*u, u*(2.-u)-.5, step(vec3f(.5),u));
               return mix(mix(mix(_t(i, u, vec3(0.,0.,0.)), _t(i, u, vec3(1.,0.,0.)), v.x),
                          mix(_t(i, u, vec3(0.,1.,0.)), _t(i, u, vec3(1.,1.,0.)), v.x), v.y),
                      mix(mix(_t(i, u, vec3(0.,0.,1.)), _t(i, u, vec3(1.,0.,1.)), v.x),
                          mix(_t(i, u, vec3(0.,1.,1.)), _t(i, u, vec3(1.,1.,1.)), v.x), v.y), v.z);
            }
            fn turbulence(P: vec3f) -> f32 {
	       var p = P;
               var f = 0.;
	       var s = 1.;
               for (var i = 0 ; i < 9 ; i++) {
                  f += abs(noise(s * P)) / s;
                  s *= 2.;
                  p = vec3(.866 * p.x + .5 * p.z, P.y + 100., -.5 * p.x + .866 * p.z);
               }
               return f;
            }

            struct MyUniforms {
  	       matrix: array<f32,16>,
               time: f32,                                // PASS IN UNIFORM time.
               _X: f32,                                  // PASS IN UNIFORM x MOUSE POSITION.
               _Y: f32,                                  // PASS IN UNIFORM y MOUSE POSITION.
	       _I: array<f32,10>,                        // PASS IN 10 UNIFORM T PARAMETERS.
            };
            @group(0) @binding(0) var<uniform> uniforms: MyUniforms;

            struct VertexOutput {
               @builtin(position) xyzw: vec4f,           // INTERPOLATE x AND y FROM TRIANGLE VERTICES.
            };

            @vertex
            fn vs(@builtin(vertex_index) VertexIndex : u32) -> VertexOutput {
               let pos = array<vec3f, 6>(
                  vec3f(-1,-1,0), vec3f(-1,1,0), vec3f(1,1,0), // FILL THE SQUARE CANVAS WITH 2 TRIANGLES.
                  vec3f(-1,-1,0), vec3f(1,-1,0), vec3f(1,1,0),
               );
               var out: VertexOutput;
               out.xyzw = vec4f(pos[VertexIndex],1);
               return out;
            }

            @fragment
            fn fs(in: VertexOutput) -> @location(0) vec4f {
  	       let m = uniforms.matrix;
	       let _I = uniforms._I;                     // PARAMETERS PASSED IN FROM THE CPU.
               let time = uniforms.time;                 // ELAPSED TIME IN SECONDS.
               let _X = uniforms._X;
               let _Y = uniforms._Y;
               let x = 2 * in.xyzw.x / 500 - 1;          // CONVERT x,y FROM PIXELS TO -1 ... +1.
               let y = 2 * in.xyzw.y / 500 - 1;
               var rgb = vec3f(.5);
               ` + shader + `
               return vec4f(rgb,1);
            }
         `;

         adapter = await navigator.gpu.requestAdapter();
         device  = await adapter.requestDevice();
         context.configure({
            device: device,
            format: navigator.gpu.getPreferredCanvasFormat(),
            alphaMode: 'premultiplied'
         });

         let sM = device.createShaderModule({ code: shaderCode });
         let cI = await sM.getCompilationInfo();
         for (const message of cI.messages)
            if (message.type === 'error') {
	       badShader = shader;
               init(oldShader);
               return;
            }

         rP = device.createRenderPipeline({
            layout: 'auto',
            vertex   : { module: sM, entryPoint: 'vs', },
            fragment : { module: sM, entryPoint: 'fs', targets: [{ format }], },
         });
         uB = device.createBuffer({ size: (16+1+1+1+10)*4, usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST });
         bG = device.createBindGroup({layout:rP.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:uB}}]});

         oldShader = shader;
         okToDraw = true;
      }

      init(newShader);
   }

   this.set_I = src => T = src.slice();

   let myM = new Matrix();

   this.draw = (x,y,w) => {
      if (okToDraw) {
         const cE = device.createCommandEncoder();
         const tV = context.getCurrentTexture().createView();
         const pE = cE.beginRenderPass({ colorAttachments: [{ view: tV, loadOp: 'clear', storeOp: 'store' }]});
         pE.setPipeline(rP);
         pE.setBindGroup(0, bG);
	 let time = Date.now() / 1000 - startTime;

	 let TT = myM.get().slice();
	 TT.push(time);
	 TT.push(xy[0]);
	 TT.push(xy[1]);
	 for (let n = 0 ; n < 10 ; n++)
	    TT.push(T[n] ?? .5);

         device.queue.writeBuffer(uB, 0, new Float32Array(TT));
         pE.draw(6,1,0,0);                                                 // DRAW 2 TRIANGLES == 6 VERTICES.
         pE.end();
         device.queue.submit([cE.finish()]);
         ctx.drawImage(canvas, x-w/2, y-w/2, w, w);
      }
   }

   this.setShader('rgb = vec3(0,.625,1);');
}

