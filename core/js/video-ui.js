class VideoUI {
  constructor(webrtcClient) {
    this.webrtcClient = webrtcClient;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isVisible = true;
    this.remoteVideoElements = new Map();

    this.createUI();
    this.setupEventHandlers();
  }

  createUI() {
    // Create main container
    this.container = document.createElement('div');
    this.container.id = 'webrtc-container';
    this.container.className = 'webrtc-hidden';
    this.container.innerHTML = `
      <div id="webrtc-videos">
        <div id="local-video-container" class="video-container">
          <video id="local-video" autoplay muted playsinline></video>
          <div class="video-label">You</div>
        </div>
        <div id="remote-videos-container"></div>
      </div>

      <div id="webrtc-controls">
        <button id="toggle-video-btn" class="control-btn" title="Toggle Video">
          📹
        </button>
        <button id="toggle-audio-btn" class="control-btn" title="Toggle Audio">
          🎤
        </button>
        <button id="toggle-webrtc-btn" class="control-btn" title="Hide Video">
          👁️
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Cache DOM elements
    this.localVideo = document.getElementById('local-video');
    this.remoteVideosContainer = document.getElementById('remote-videos-container');
    this.toggleVideoBtn = document.getElementById('toggle-video-btn');
    this.toggleAudioBtn = document.getElementById('toggle-audio-btn');
    this.toggleWebRTCBtn = document.getElementById('toggle-webrtc-btn');
  }

  setupEventHandlers() {
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

    // Toggle visibility
    this.toggleWebRTCBtn.addEventListener('click', () => {
      this.toggleVisibility();
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

    // Create video element
    const videoContainer = document.createElement('div');
    videoContainer.className = 'video-container';
    videoContainer.id = `remote-${clientId}`;

    const video = document.createElement('video');
    video.autoplay = true;
    video.playsinline = true;
    video.srcObject = stream;

    const label = document.createElement('div');
    label.className = 'video-label';
    label.textContent = `User ${clientId.substr(0, 6)}`;

    videoContainer.appendChild(video);
    videoContainer.appendChild(label);
    this.remoteVideosContainer.appendChild(videoContainer);

    this.remoteVideoElements.set(clientId, videoContainer);

    // Show the container if hidden
    if (this.container.classList.contains('webrtc-hidden')) {
      this.show();
    }
  }

  removeRemoteVideo(clientId) {
    console.log('Removing remote video for:', clientId);

    const videoContainer = this.remoteVideoElements.get(clientId);
    if (videoContainer) {
      videoContainer.remove();
      this.remoteVideoElements.delete(clientId);
    }

    // Hide if no remote videos left
    if (this.remoteVideoElements.size === 0 && this.isVisible) {
      this.hide();
    }
  }

  toggleVisibility() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  show() {
    this.container.classList.remove('webrtc-hidden');
    this.isVisible = true;
    this.toggleWebRTCBtn.textContent = '👁️';
    this.toggleWebRTCBtn.title = 'Hide Video';
  }

  hide() {
    this.container.classList.add('webrtc-hidden');
    this.isVisible = false;
    this.toggleWebRTCBtn.textContent = '👁️❌';
    this.toggleWebRTCBtn.title = 'Show Video';
  }
}
