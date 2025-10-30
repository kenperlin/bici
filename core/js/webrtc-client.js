// WebRTC Configuration
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

class WebRTCClient {
  constructor() {
    this.localStream = null;
    this.ws = null;
    this.myClientId = null;
    this.peerConnections = new Map();
    this.remoteStreams = new Map();
    this.onRemoteStreamAdded = null;
    this.onRemoteStreamRemoved = null;
    this.onConnectionStatusChanged = null;
  }

  async init() {
    try {
      // Get user media with smaller resolution for better performance
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: true
      });

      // Connect to signaling server
      this.connectToSignalingServer();

      return this.localStream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      throw error;
    }
  }

  connectToSignalingServer() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log('Connected to signaling server');
      if (this.onConnectionStatusChanged) {
        this.onConnectionStatusChanged(true);
      }
    };

    this.ws.onmessage = async (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'welcome':
          this.myClientId = data.clientId;
          console.log('My client ID:', this.myClientId);
          break;

        case 'client-list':
          this.handleClientList(data.clients);
          break;

        case 'offer':
          await this.handleOffer(data.from, data.offer);
          break;

        case 'answer':
          await this.handleAnswer(data.from, data.answer);
          break;

        case 'ice-candidate':
          await this.handleIceCandidate(data.from, data.candidate);
          break;
      }
    };

    this.ws.onclose = () => {
      console.log('Disconnected from signaling server');
      if (this.onConnectionStatusChanged) {
        this.onConnectionStatusChanged(false);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  handleClientList(clients) {
    // Auto-connect to new clients
    const otherClients = clients.filter(id => id !== this.myClientId);

    otherClients.forEach(clientId => {
      // Only initiate call if we don't already have a connection
      // and if our ID is "greater" (to avoid both peers initiating)
      if (!this.peerConnections.has(clientId) && this.myClientId > clientId) {
        console.log('Auto-connecting to:', clientId);
        this.initiateCall(clientId);
      }
    });
  }

  async initiateCall(targetClientId) {
    console.log('Initiating call to:', targetClientId);

    const pc = this.createPeerConnection(targetClientId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      this.sendSignalingMessage({
        type: 'offer',
        target: targetClientId,
        offer: offer
      });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }

  async handleOffer(fromClientId, offer) {
    console.log('Received offer from:', fromClientId);

    const pc = this.createPeerConnection(fromClientId);

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      this.sendSignalingMessage({
        type: 'answer',
        target: fromClientId,
        answer: answer
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  async handleAnswer(fromClientId, answer) {
    console.log('Received answer from:', fromClientId);

    const pc = this.peerConnections.get(fromClientId);
    if (pc) {
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (error) {
        console.error('Error handling answer:', error);
      }
    }
  }

  async handleIceCandidate(fromClientId, candidate) {
    const pc = this.peerConnections.get(fromClientId);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }

  createPeerConnection(clientId) {
    const pc = new RTCPeerConnection(configuration);

    // Add local stream tracks to the connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream);
      });
    }

    // Handle incoming tracks
    pc.ontrack = (event) => {
      console.log('Received remote track from:', clientId, 'kind:', event.track.kind);
      const remoteStream = event.streams[0];

      // Only trigger onRemoteStreamAdded once (when we receive the first track)
      if (!this.remoteStreams.has(clientId)) {
        this.remoteStreams.set(clientId, remoteStream);

        if (this.onRemoteStreamAdded) {
          this.onRemoteStreamAdded(clientId, remoteStream);
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.sendSignalingMessage({
          type: 'ice-candidate',
          target: clientId,
          candidate: event.candidate
        });
      }
    };

    // Handle connection state changes
    pc.onconnectionstatechange = () => {
      console.log(`Connection state with ${clientId}:`, pc.connectionState);

      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        this.removePeerConnection(clientId);
      }
    };

    this.peerConnections.set(clientId, pc);
    return pc;
  }

  removePeerConnection(clientId) {
    const pc = this.peerConnections.get(clientId);
    if (pc) {
      pc.close();
      this.peerConnections.delete(clientId);
    }

    const stream = this.remoteStreams.get(clientId);
    if (stream) {
      this.remoteStreams.delete(clientId);

      if (this.onRemoteStreamRemoved) {
        this.onRemoteStreamRemoved(clientId);
      }
    }
  }

  sendSignalingMessage(message) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  toggleVideo(enabled) {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = enabled;
        return enabled;
      }
    }
    return false;
  }

  toggleAudio(enabled) {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = enabled;
        return enabled;
      }
    }
    return false;
  }

  hangUp() {
    // Close all peer connections
    this.peerConnections.forEach((pc, clientId) => {
      pc.close();
      this.peerConnections.delete(clientId);
    });

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Clear remote streams
    this.remoteStreams.clear();
  }

  getMyClientId() {
    return this.myClientId;
  }

  getRemoteStreams() {
    return this.remoteStreams;
  }
}
