class VideoUI {
  constructor(webrtcClient) {
    this.webrtcClient = webrtcClient;
    this.isVideoEnabled = true;
    this.isAudioEnabled = true;
    this.isVisible = true;
    this.remoteVideoElements = new Map();

    // Create off-screen canvas for remote video (like webcam.canvas)
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '2000px';
    this.canvas.width = 640;
    this.canvas.height = 480;
    this.ctx = this.canvas.getContext('2d');

    // Create off-screen video element for remote stream
    this.remoteVideo = document.createElement('video');
    this.remoteVideo.autoplay = true;
    this.remoteVideo.style.position = 'absolute';
    this.remoteVideo.style.top = '-2000px';

    this.createUI();
    this.setupEventHandlers();
  }

  createUI() {
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
        <button id="toggle-webrtc-btn" class="control-btn" title="Hide Video">
          👁️
        </button>
      </div>
    `;

    document.body.appendChild(this.container);

    // Cache DOM elements
    this.localVideo = document.getElementById('local-video');
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

    // Set the remote video stream (only support one remote peer for now)
    this.remoteVideo.srcObject = stream;
    this.hasRemoteVideo = true;

    // Show the container if hidden
    if (this.container.classList.contains('webrtc-hidden')) {
      this.show();
    }
  }

  // Update method to draw remote video to canvas (like webcam.update)
  update() {
    if (this.hasRemoteVideo && this.remoteVideo.readyState >= 2) {
      // Get actual video dimensions
      const videoWidth = this.remoteVideo.videoWidth;
      const videoHeight = this.remoteVideo.videoHeight;

      if (videoWidth && videoHeight) {
        // Clear canvas first
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, 640, 480);

        // Calculate aspect ratio to fit video (contain mode - no stretching)
        const canvasAspect = 640 / 480;
        const videoAspect = videoWidth / videoHeight;

        let drawWidth, drawHeight, offsetX, offsetY;

        if (videoAspect > canvasAspect) {
          // Video is wider - fit to width
          drawWidth = 640;
          drawHeight = 640 / videoAspect;
          offsetX = 0;
          offsetY = (480 - drawHeight) / 2;
        } else {
          // Video is taller - fit to height
          drawHeight = 480;
          drawWidth = 480 * videoAspect;
          offsetX = (640 - drawWidth) / 2;
          offsetY = 0;
        }

        // Draw remote video with proper aspect ratio
        this.ctx.drawImage(this.remoteVideo, offsetX, offsetY, drawWidth, drawHeight);
      }
    } else {
      // Clear canvas if no remote video
      this.ctx.fillStyle = 'black';
      this.ctx.fillRect(0, 0, 640, 480);
    }
  }

  removeRemoteVideo(clientId) {
    console.log('Removing remote video for:', clientId);

    // Clear the remote video
    this.remoteVideo.srcObject = null;
    this.hasRemoteVideo = false;

    // Hide if no remote videos left
    if (this.isVisible) {
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
