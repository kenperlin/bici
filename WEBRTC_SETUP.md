# BICI WebRTC Integration

This document explains how to use the WebRTC video chat feature in BICI.

## Overview

BICI now includes peer-to-peer video chat functionality, allowing multiple users to see each other while collaborating on interactive presentations and 3D graphics.

## Features

- **Peer-to-Peer Video Chat**: Direct WebRTC connections between users
- **Auto-Connection**: Automatically connects when users join the same session
- **Video Controls**: Toggle video, audio, and visibility
- **Minimal UI**: Small video thumbnails in bottom-right corner
- **Low Latency**: Direct P2P connections for minimal delay

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

This installs only 2 dependencies:
- `express` - Web server
- `ws` - WebSocket signaling server

### 2. Start the Server

```bash
npm start
```

The server will start on `http://localhost:8000`

### 3. Open Multiple Browser Windows

1. Open `http://localhost:8000` in your first browser window
2. Click a project button (e.g., "1029")
3. Allow camera and microphone access when prompted
4. Open `http://localhost:8000` in a second browser window (or different browser/device)
5. Click the same project button
6. Allow camera and microphone access

The two windows will automatically connect via WebRTC!

## Usage

### Video Controls

Three control buttons appear in the bottom-right corner:

- **📹 Video Toggle**: Turn your camera on/off
- **🎤 Audio Toggle**: Mute/unmute your microphone
- **👁️ Visibility Toggle**: Hide/show all video windows

### Video Layout

- **Your video**: Green border, labeled "You"
- **Remote videos**: Appear to the left of your video
- **Multiple users**: Videos stack horizontally (up to 2), then vertically

### Keyboard Shortcuts

All existing BICI keyboard shortcuts still work:
- Press `h` for help menu
- Press `0-9` to switch 3D scenes
- Press `/` for draw mode
- Press `s` to toggle 3D scene
- etc.

## Architecture

### Files Added

```
bici/
├── server.js                      # WebRTC signaling server
├── package.json                   # Node.js dependencies
├── core/
│   ├── js/
│   │   ├── webrtc-client.js      # WebRTC peer connection logic
│   │   └── video-ui.js           # Video UI and controls
│   └── css/
│       └── webrtc.css            # Video styling
```

### How It Works

1. **Signaling Server** (`server.js`):
   - WebSocket server for coordinating connections
   - Relays offer/answer/ICE candidates between peers
   - Maintains list of connected clients

2. **WebRTC Client** (`webrtc-client.js`):
   - Manages RTCPeerConnection instances
   - Handles media stream negotiation
   - Auto-connects to other users

3. **Video UI** (`video-ui.js`):
   - Creates video elements dynamically
   - Provides toggle controls
   - Manages visibility

4. **Integration** (`main.js`):
   - Initializes WebRTC on project load
   - Runs alongside existing BICI features

## Network Configuration

### Local Testing

For local testing (same network), no configuration needed. The default STUN servers work:
- `stun.l.google.com:19302`
- `stun1.l.google.com:19302`

### Internet Deployment

For deployment across the internet:

1. **HTTPS Required**: WebRTC requires HTTPS in production
   - Use a reverse proxy (nginx, Caddy)
   - Get SSL certificate (Let's Encrypt)

2. **TURN Server** (optional): For users behind strict firewalls
   - Add TURN server configuration to `core/js/webrtc-client.js`
   - Example services: Twilio, Xirsys, or self-hosted coturn

## Troubleshooting

### Camera Permission Denied

- Browser blocks camera by default on insecure origins (http://)
- Use `https://` or `localhost` for testing
- Check browser settings: Site Settings > Camera/Microphone

### No Video Appears

1. Check browser console for errors
2. Verify both users loaded the same project
3. Ensure server is running (`npm start`)
4. Try refreshing both browser windows

### Connection Failed

1. Check firewall settings
2. Verify STUN servers are accessible
3. For strict NAT/firewalls, add TURN server
4. Check browser compatibility (Chrome, Firefox, Safari, Edge supported)

### Performance Issues

- Reduce video resolution in `webrtc-client.js` (line 29)
- Limit number of simultaneous connections (3-4 max recommended)
- Check CPU usage (WebGL + video encoding can be intensive)

## Customization

### Change Video Size

Edit `core/css/webrtc.css`:

```css
.video-container {
  width: 300px;  /* Default: 200px */
  height: 225px; /* Default: 150px */
}
```

### Change Video Position

Edit `core/css/webrtc.css`:

```css
#webrtc-container {
  bottom: 20px;
  right: 20px;  /* Change to 'left: 20px' for left side */
}
```

### Adjust Video Quality

Edit `core/js/webrtc-client.js`:

```javascript
this.localStream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: 1280,  // Higher resolution
    height: 720,
    frameRate: 30 // Higher frame rate
  },
  audio: true
});
```

## Deployment

### Deploy to Render.com (Free)

1. Push to GitHub
2. Create new Web Service on Render
3. Connect your repository
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Deploy!

### Deploy to Your Own Server

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Clone and setup
git clone <your-repo>
cd bici
npm install

# Run with PM2 (process manager)
npm install -g pm2
pm2 start server.js
pm2 save
pm2 startup
```

## Security Notes

- No authentication implemented (anyone can join)
- All connections are peer-to-peer (end-to-end encrypted by WebRTC)
- Signaling server only relays connection metadata
- Media streams never pass through server

## Future Enhancements

Potential additions (not implemented):
- Screen sharing
- Recording functionality
- Chat messages
- Room management
- User authentication
- Mobile app

## Credits

WebRTC implementation adapted from InsightFlow project.
Integration by Alex Liu for Ken Perlin's BICI platform.

## License

Same as BICI project.
