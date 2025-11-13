function ScriptPanel () {
    let isOpen = false;
    let panel = null;
    let textarea = null;
    let savedContent = '';

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
        header.textContent = 'Script Panel';
        header.style.fontFamily = "Arial";
        header.style.fontSize = '18px';
        header.style.fontWeight = 'bold';
        header.style.marginBottom = '5px';
        header.style.textAlign = 'center';
        
        // Create textarea
        textarea = document.createElement('textarea');
        textarea.id = 'scriptInput';
        textarea.spellcheck = false;
        textarea.style.width = '100%';
        textarea.style.flex = '1';
        textarea.style.backgroundColor = 'rgba(255,255,255,.6)';
        textarea.style.border = 'none';
        textarea.style.padding = '5px';
        textarea.style.fontFamily = 'Arial';
        textarea.style.fontSize = '16px';
        textarea.style.resize = 'none';
        textarea.style.outline = 'none';
        textarea.placeholder = 'Type here...';
        textarea.value = savedContent;  // Restore saved content

        textarea.addEventListener('keydown', (e) => {
            e.stopPropagation();
        });
        
        // button container
        let buttonContainer = document.createElement('div');
        buttonContainer.style.display = 'flex';
        buttonContainer.style.gap = '5px';
        
        // clear button
        let clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
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
        
        // Assemble
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(closeBtn);
        
        panel.appendChild(header);
        panel.appendChild(textarea);
        panel.appendChild(buttonContainer);
        document.body.appendChild(panel);
        
        // Auto-focus
        textarea.focus();
    }
    
    this.close = () => {
        if (!isOpen) return;
        
        // Save content before closing
        if (textarea) {
            savedContent = textarea.value;
        }
        
        if (panel) {
            panel.remove();
            panel = null;
            textarea = null;
        }
        isOpen = false;
    }
    
    this.getContent = () => {
        return textarea ? textarea.value : savedContent;
    }
    
    this.setContent = (text) => {
        savedContent = text;
        if (textarea) {
            textarea.value = text;
        }
    }
    
    this.clear = () => {
        savedContent = '';  // Clear saved content too
        if (textarea) {
            textarea.value = '';
            textarea.focus();
        }
    }

}

let scriptPanel = new ScriptPanel();