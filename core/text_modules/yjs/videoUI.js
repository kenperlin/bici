export class VideoUI {
  constructor(webrtcClient) {
    this.webrtcClient = webrtcClient;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isPanelVisible = false;
    this.remoteVideoElements = new Map();

    // Create off-screen video element for remote stream
    this.remoteVideo = document.createElement('video');
    this.remoteVideo.autoplay = true;
    this.remoteVideo.style.position = 'absolute';
    this.remoteVideo.style.top = '-2000px';

    this.createUI();
    this.setupEventHandlers();
  }

  createUI() {
    // Create always-visible toggle button at bottom right
    this.panelToggleBtn = document.createElement('button');
    this.panelToggleBtn.id = 'webrtc-panel-toggle';
    this.panelToggleBtn.className = 'panel-toggle-btn';
    this.panelToggleBtn.title = 'Show Video Panel';
    this.panelToggleBtn.textContent = '📹';
    document.body.appendChild(this.panelToggleBtn);

    // Create main container - only for local PiP and controls
    this.container = document.createElement('div');
    this.container.id = 'webrtc-container';
    this.container.className = 'webrtc-hidden';
    this.container.innerHTML = `
      <div id="local-video-container" class="video-container local-pip">
        <video id="local-video" autoplay muted playsinline></video>
        <div class="video-label">You</div>
      </div>

      <div id="webrtc-controls">
        <button id="toggle-video-btn" class="control-btn" title="Toggle Video">
          📹
        </button>
        <button id="toggle-audio-btn" class="control-btn" title="Toggle Audio">
          🎤
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Cache DOM elements
    this.localVideo = document.getElementById('local-video');
    this.toggleVideoBtn = document.getElementById('toggle-video-btn');
    this.toggleAudioBtn = document.getElementById('toggle-audio-btn');
  }

  setupEventHandlers() {
    // Toggle panel visibility (always-visible button)
    this.panelToggleBtn.addEventListener('click', () => {
      this.togglePanel();
    });

    // Toggle video
    this.toggleVideoBtn.addEventListener('click', () => {
      this.isVideoEnabled = !this.isVideoEnabled;
      this.webrtcClient.toggleVideo(this.isVideoEnabled);
      this.toggleVideoBtn.textContent = this.isVideoEnabled ? '📹' : '📹❌';
      this.toggleVideoBtn.classList.toggle('disabled', !this.isVideoEnabled);
    });

    // Toggle audio
    this.toggleAudioBtn.addEventListener('click', () => {
      this.isAudioEnabled = !this.isAudioEnabled;
      this.webrtcClient.toggleAudio(this.isAudioEnabled);
      this.toggleAudioBtn.textContent = this.isAudioEnabled ? '🎤' : '🎤❌';
      this.toggleAudioBtn.classList.toggle('disabled', !this.isAudioEnabled);
    });

    // Setup WebRTC callbacks
    this.webrtcClient.onRemoteStreamAdded = (clientId, stream) => {
      this.addRemoteVideo(clientId, stream);
    };

    this.webrtcClient.onRemoteStreamRemoved = (clientId) => {
      this.removeRemoteVideo(clientId);
    };

    this.webrtcClient.onConnectionStatusChanged = (connected) => {
      console.log('Connection status:', connected ? 'Connected' : 'Disconnected');
    };
  }

  setLocalStream(stream) {
    this.localVideo.srcObject = stream;
  }

  addRemoteVideo(clientId, stream) {
    console.log('Adding remote video for:', clientId);

    // Set the remote video stream (only support one remote peer for now)
    this.remoteVideo.srcObject = stream;

    // Show the panel if hidden when remote video connects
    if (!this.isPanelVisible) {
      this.showPanel();
    }
  }

  hasRemoteVideo() {
    return this.remoteVideo.readyState >= 2;
  }

  removeRemoteVideo(clientId) {
    console.log('Removing remote video for:', clientId);

    // Clear the remote video
    this.remoteVideo.srcObject = null;
  }

  togglePanel() {
    if (this.isPanelVisible) {
      this.hidePanel();
    } else {
      this.showPanel();
    }
  }

  showPanel() {
    this.container.classList.remove('webrtc-hidden');
    this.isPanelVisible = true;
    this.panelToggleBtn.classList.add('active');
    this.panelToggleBtn.title = 'Hide Video Panel';
  }

  hidePanel() {
    this.container.classList.add('webrtc-hidden');
    this.isPanelVisible = false;
    this.panelToggleBtn.classList.remove('active');
    this.panelToggleBtn.title = 'Show Video Panel';
  }
}
