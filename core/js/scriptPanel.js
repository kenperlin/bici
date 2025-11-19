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
        
        // clear button
        let clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear History';
        clearBtn.style.flex = '1';
        clearBtn.style.padding = '5px';
        clearBtn.style.fontFamily = 'Arial';
        clearBtn.style.fontWeight = 'bold';
        clearBtn.style.color = "white";
        clearBtn.style.backgroundColor = 'rgba(0, 0, 255, 0.5)';
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
        closeBtn.style.backgroundColor = 'rgba(255, 0, 0, 0.5)';
        closeBtn.style.border = '1px solid #ccc';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.fontSize = '14px';
        closeBtn.onclick = () => this.close();

        // Ask Gemini button
        let askGeminiBtn = document.createElement('button');
        askGeminiBtn.textContent = 'Ask Gemini';
        askGeminiBtn.style.flex = '1';
        askGeminiBtn.style.padding = '5px';
        askGeminiBtn.style.fontFamily = 'Arial';
        askGeminiBtn.style.fontWeight = 'bold';
        askGeminiBtn.style.color = "white";
        askGeminiBtn.style.backgroundColor = 'rgba(0, 255, 0, 0.5)';
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
            const response = await fetch('/api/gemini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    prompt: prompt,
                    history: conversationHistory
                })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                outputTextarea.value = data.response;
                savedOutputContent = data.response;
                
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

}

let scriptPanel = new ScriptPanel();