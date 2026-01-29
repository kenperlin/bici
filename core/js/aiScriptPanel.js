function ScriptPanel () {
    let isOpen = false;
    let panel = null;
    let inputTextarea = null;
    let outputTextarea = null;
    let savedInputContent = '';
    let savedOutputContent = '';
    // Add conversation history to track the prompt each quary
    let conversationHistory = [];

    this.isOpen = () => isOpen;

    this.toggle = () => {
        if (isOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    this.open = () => {
        if (isOpen) return;
      
        isOpen = true;

        panel = document.createElement('div');
        panel.id = 'scriptPanel';
        panel.style.position = 'fixed';
        panel.style.bottom = '20px';
        panel.style.left = '20px';
        panel.style.width = '600px';
        panel.style.height = '400px';
        panel.style.backgroundColor = 'rgba(255,255,255,.6)';
        panel.style.padding = '10px';
        panel.style.display = 'flex';
        panel.style.flexDirection = 'column';
        panel.style.gap = '5px';
        
        // Create header
        let header = document.createElement('div');
        header.textContent = 'AI Script Panel';
        header.style.fontFamily = "Arial";
        header.style.fontSize = '18px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '5px';
        header.style.textAlign = 'center';
        
        // Create input textarea
        inputTextarea = document.createElement('textarea');
        inputTextarea.id = 'scriptInput';
        inputTextarea.spellcheck = false;
        inputTextarea.style.width = '100%';
        inputTextarea.style.flex = '1';
        inputTextarea.style.backgroundColor = 'rgba(255,255,255,.6)';
        inputTextarea.style.border = 'none';
        inputTextarea.style.padding = '5px';
        inputTextarea.style.fontFamily = 'Arial';
        inputTextarea.style.fontSize = '16px';
        inputTextarea.style.resize = 'none';
        inputTextarea.style.outline = 'none';
        inputTextarea.placeholder = 'Type here...';
        inputTextarea.value = savedInputContent;

        inputTextarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });

        // Create output textarea (lower half)
        outputTextarea = document.createElement('textarea');
        outputTextarea.id = 'scriptOutput';
        outputTextarea.spellcheck = false;
        outputTextarea.style.width = '100%';
        outputTextarea.style.flex = '3';
        outputTextarea.style.backgroundColor = 'rgba(200,200,200,.6)';
        outputTextarea.style.border = 'none';
        outputTextarea.style.padding = '5px';
        outputTextarea.style.fontFamily = 'Arial';
        outputTextarea.style.fontSize = '16px';
        outputTextarea.style.resize = 'none';
        outputTextarea.style.outline = 'none';
        outputTextarea.placeholder = 'Answer...';
        outputTextarea.value = savedOutputContent;
        outputTextarea.readOnly = true;

        outputTextarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        
        // button container
        let buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        
        // clear chat history button
        let clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear History';
        clearBtn.style.flex = '1';
        clearBtn.style.padding = '5px';
        clearBtn.style.fontFamily = 'Arial';
        clearBtn.style.fontWeight = 'bold';
        clearBtn.style.color = "white";
        clearBtn.style.backgroundColor = 'rgba(128, 128, 128, 0.6)';
        clearBtn.style.border = '1px solid #ccc';
        clearBtn.style.cursor = 'pointer';
        clearBtn.style.fontSize = '14px';
        clearBtn.onclick = () => this.clear();
        
        // close button
        let closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.flex = '1';
        closeBtn.style.padding = '5px';
        closeBtn.style.fontFamily = 'Arial';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.color = "white";
        closeBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
        closeBtn.style.border = '1px solid #ccc';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '14px';
        closeBtn.onclick = () => this.close();

        // Ask Gemini button
        let askGeminiBtn = document.createElement('button');
        askGeminiBtn.innerHTML = `Ask Gemini<span style="
                background: linear-gradient(135deg, red 0%, orange 40%, yellow 55%, green 65%, blue 85%);
                -webkit-background-clip: text;
                background-clip: text;
                -webkit-text-fill-color: transparent;
                color: transparent;
                font-size: 20px;
            "> ✦ </span>`;
        askGeminiBtn.style.flex = '1';
        askGeminiBtn.style.padding = '5px';
        askGeminiBtn.style.fontFamily = 'Arial';
        askGeminiBtn.style.fontWeight = 'bold';
        askGeminiBtn.style.color = "white";
        askGeminiBtn.style.backgroundColor = 'rgba(66, 133, 244, 0.6)';
        askGeminiBtn.style.border = '1px solid #ccc';
        askGeminiBtn.style.cursor = 'pointer';
        askGeminiBtn.style.fontSize = '14px';
        askGeminiBtn.onclick = () => this.askGemini();
        
        // Assemble
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(askGeminiBtn);
        buttonContainer.appendChild(closeBtn);
        
        panel.appendChild(header);
        panel.appendChild(inputTextarea);
        panel.appendChild(outputTextarea);
        panel.appendChild(buttonContainer);
        document.body.appendChild(panel);
        
        // Auto-focus
        inputTextarea.focus();
    }
    
    this.close = () => {
        if (!isOpen) return;
        
        // Save content before closing
        if (inputTextarea) {
            savedInputContent = inputTextarea.value;
        }
        if (outputTextarea) {
            savedOutputContent = outputTextarea.value;
        }
        
        if (panel) {
            panel.remove();
            panel = null;
            inputTextarea = null;
            outputTextarea = null;
        }
        isOpen = false;
    }
    
    this.getContent = () => {
        return inputTextarea ? inputTextarea.value : savedInputContent;
    }
    
    this.setContent = (text) => {
        savedInputContent = text;
        if (inputTextarea) {
            inputTextarea.value = text;
        }
    }
    
    this.clear = () => {
        savedInputContent = '';
        savedOutputContent = '';
        conversationHistory = [];
        if (inputTextarea) {
            inputTextarea.value = '';
            inputTextarea.focus();
        }
        if (outputTextarea) {
            outputTextarea.value = '';
        }
    }

    this.simulateKeyPress = (key) => {
        const event = new KeyboardEvent('keyup', {
            key: key,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    this.navigateToSliders = () => {
        if (!isInfo) {
            this.simulateKeyPress('i');
        }
    }

    // Activate the Gemini AI
    this.askGemini = async () => {
        const prompt = inputTextarea.value.trim();
        
        if (!prompt) {
            outputTextarea.value = 'Please enter a question first.';
            return;
        }
    
        // Show loading message
        outputTextarea.value = 'Asking Gemini...';
    
        try {
            // Add system context about available scene controls
            const systemPrompt = `You are helping control a 3D scene with interactive sliders.
            When the user asks to change or modify colors, respond with:
                1. A natural language confirmation that you'll open the sliders
                2. A JSON command block wrapped in \`\`\`json tags with the format:
                \`\`\`json
                {
                "action": "openSliders",
                "slideType": "color"
                }
                \`\`\`
            
                Examples:
                - "change the color" → "I'll open the sliders for you to adjust the color." + {"action": "openSliders", "slideType": "color"}
                - "I want to change the color" → "Sure! Opening the sliders now." + {"action": "openSliders", "slideType": "color"}

                When the user asks to modify POSITION or MOVEMENT, respond with:
                \`\`\`json
                {
                "action": "openSliders",
                "slideType": "position"
                }
                \`\`\`

                Examples:
                - "change position/movement/xy axies" → {"action": "openSliders", "slideType": "position"}
                - "change the movement → {"action": "openSliders", "slideType": "position"}
                - "move the scene" → {"action": "openSliders", "slideType": "position"}
                - "open the sliders" → {"action": "openSliders", "slideType": "position"}
            
            **For adding objects to the scene:**
            When the user asks to add objects (sphere, cube, etc.), respond with:
                \`\`\`json
                {
                "action": "addObject",
                "objectType": "sphere",
                "code": "let sphere = Shape.sphereMesh(30,15);let scal = 0.500; let red = 0.500; let green = 0.500;"
                "drawCode": "drawObj(sphere, 
                                    mxm(move(0,0.3+scal,0),
                                    scale(scal)),
                                    [red,green,.5]);"
                }
                \`\`\`

                Examples: 
                - "add a sphere on the cube" → {"action": "addObject", "objectType": "sphere", 
                                "code": 
                                    "let sphere = Shape.sphereMesh(30,15); 
                                    let scal = 0.500;
                                    let red = .500;
                                    let green = .500;", 
                                    "drawCode": "drawObj(sphere, 
                                                        mxm(move(0,0.3+scal,0),
                                                        scale(scal)),
                                                        [red,green,.5])"}

            **For adding scale slider to the existing sliders:**
            \`\`\`json
            {
                "action": "addScaleSlider"
            }
            \`\`\`

            Examples:
                - "add a scale slider" → {"addScaleSlider": true}
                - "create a scale slider" → {"addScaleSlider": true}
                - "I want to control the scale" → {"addScaleSlider": true}
                - "add slider for scale" → {"addScaleSlider": true}
            `;
            
            
            
            
            // older prompt
            /*
            `You are helping control a 3D scene. The scene has the following properties that can be modified:
                - scaleValue: controls the size of objects (default 0.3, range 0.1 to 1.0)
                - color: RGB color array where each value is 0-1 (e.g., [1,0,0] for red, [0,1,0] for green, [0,0,1] for blue, [1,1,0] for yellow)
                

                When the user asks to modify the scene, respond with:
                1. A natural language confirmation
                2. A JSON command block wrapped in \`\`\`json tags with the format:
                \`\`\`json
                {
                "scaleValue": <number>,
                "color": [<r>, <g>, <b>]
                }
                \`\`\`

                Only include properties that need to be changed.

                Examples:
                - "make it yellow" → {"color": [1, 1, 0]}
                - "make it red" → {"color": [1, 0, 0]}
                - "make it bigger" → {"scaleValue": 0.6}
                - "make it small and red" → {"scaleValue": 0.2, "color": [1, 0, 0]}`;
            */

            // Prepend system context to conversation history if it's the first message
            const historyWithSystem = conversationHistory.length === 0 
                ? [{
                    role: 'user',
                    parts: [{ text: systemPrompt }]
                }, {
                    role: 'model',
                    parts: [{ text: 'I understand. I can help you modify the 3D scene by changing the scale and color. Just tell me what you want to change!' }]
                }]
                : [];

            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    history: [...historyWithSystem, ...conversationHistory]
                })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                outputTextarea.value = data.response;
                savedOutputContent = data.response;

                // Parse and execute commands from Gemini's response
                this.parseAndExecuteCommands(data.response);
                
                // Add to conversation history
                conversationHistory.push({
                    role: 'user',
                    parts: [{ text: prompt }]
                });
                conversationHistory.push({
                    role: 'model',
                    parts: [{ text: data.response }]
                });
                
                // Clear input for next question
                inputTextarea.value = '';
                savedInputContent = '';

            } else {
                outputTextarea.value = 'Error: ' + (data.error || 'Unknown error');
            }
        } catch (error) {
            outputTextarea.value = 'Error: Failed to connect to server';
            console.error('Error:', error);
        }
    }

    this.parseAndExecuteCommands = (response) => {
        try {
            const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            
            if (jsonMatch && jsonMatch[1]) {
                const commands = JSON.parse(jsonMatch[1]);
                
                if (commands.action === 'openSliders') {
                    const targetSlide = commands.slideType === 'position' ? 2 : 1;
                    console.log(`Target slide: ${targetSlide}`);
                
                    // Get current slide position (even if slides are closed)
                    let currentSlide = 0;
                    try {
                        if (typeof slideIndex !== 'undefined') {
                            currentSlide = slideIndex;
                        }
                    } catch (e) {
                        console.log('Cannot access slideIndex, assuming 0');
                    }
                    console.log(`Current slideIndex: ${currentSlide}`);
                    
                    // Check if slides are open
                    let slidesOpen = false;
                    try {
                        slidesOpen = typeof isInfo !== 'undefined' && isInfo;
                    } catch (e) {
                        console.log('Cannot access isInfo');
                    }
                    console.log(`Slides open: ${slidesOpen}`);
                    
                    if (!slidesOpen) {
                        // Open the slides
                        const iEvent = new KeyboardEvent('keyup', {
                            key: 'i',
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(iEvent);
                        console.log('Pressed "i" to open slides');
                        // slideIndex doesn't change when opening - stays at currentSlide
                    }
                    
                    // Calculate navigation from current position to target
                    setTimeout(() => {
                        const diff = targetSlide - currentSlide;
                        
                        if (diff === 0) {
                            console.log('Already on target slide!');
                            return;
                        }
                        
                        const key = diff > 0 ? 'ArrowRight' : 'ArrowLeft';
                        const presses = Math.abs(diff);
                        
                        console.log(`Navigating from slide ${currentSlide} to ${targetSlide}: pressing ${key} ${presses} time(s)`);
                        
                        for (let i = 0; i < presses; i++) {
                            setTimeout(() => {
                                const arrowEvent = new KeyboardEvent('keyup', {
                                    key: key,
                                    bubbles: true,
                                    cancelable: true
                                });
                                document.dispatchEvent(arrowEvent);
                                console.log(`Pressed ${key} (${i + 1}/${presses})`);
                            }, i * 100);
                        }
                    }, 150);
                } else if (commands.action === 'addObject') {
                        // Handle adding objects to the scene
                        console.log('Adding object to scene:', commands);
                        
                        // Open code editor with 'c'
                        const cEvent = new KeyboardEvent('keyup', {
                            key: 'c',
                            bubbles: true,
                            cancelable: true
                        });
                        document.dispatchEvent(cEvent);
                        console.log('Opened code editor with "c"');
                        
                        // Get current scene code and modify it
                        setTimeout(() => {
                            try {
                                if (typeof codeArea !== 'undefined' && codeArea.getElement) {
                                    const editor = codeArea.getElement();
                                    let currentCode = editor.value;
                                    
                                    // Parse the current code to add the new object
                                    // Find where to insert the object declaration (after other variable declarations)
                                    const insertAfterLine = currentCode.match(/let \w+ = Shape\.\w+\(\);/g);
                                    if (insertAfterLine) {
                                        // Add after last Shape declaration
                                        const lastShapeIndex = currentCode.lastIndexOf(insertAfterLine[insertAfterLine.length - 1]);
                                        const insertPosition = currentCode.indexOf('\n', lastShapeIndex) + 1;
                                        currentCode = currentCode.slice(0, insertPosition) + 
                                                     '   ' + commands.code + '\n' + 
                                                     currentCode.slice(insertPosition);
                                    }
                                    
                                    // Find the update function and add the draw call
                                    const updateMatch = currentCode.match(/this\.update = \(\) => \{([\s\S]*?)\n   \}/);
                                    if (updateMatch) {
                                        const updateBody = updateMatch[1];
                                        const lastDrawObj = updateBody.lastIndexOf('drawObj');
                                        if (lastDrawObj !== -1) {
                                            const insertPos = currentCode.indexOf(updateBody) + updateBody.length;
                                            currentCode = currentCode.slice(0, insertPos) + 
                                                         '\n      ' + commands.drawCode + 
                                                         currentCode.slice(insertPos);
                                        }
                                    }
                                    
                                    // Update the editor
                                    editor.value = currentCode;
                                    console.log('Updated scene code');
                                    
                                    // Close code editor and reload scene
                                    setTimeout(() => {
                                        document.dispatchEvent(new KeyboardEvent('keyup', {
                                            key: 'c',
                                            bubbles: true,
                                            cancelable: true
                                        }));
                                        console.log('Closed code editor - scene updated');
                                    }, 500);
                                }
                            } catch (error) {
                                console.error('Error modifying scene code:', error);
                            }
                        }, 200);
                } else {
                    
                    window.dispatchEvent(new CustomEvent('sceneCommand', {
                        detail: commands
                    }));
                    
                    console.log('Dispatched scene command:', commands);
                    
                }
                
            }
        } catch (error) {
            console.error('Error parsing commands:', error);
        }
    }

}

let scriptPanel = new ScriptPanel();