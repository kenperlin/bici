# BICI WebRTC Integration

This document explains how to use the WebRTC video chat feature in BICI.

## Overview

BICI now includes peer-to-peer video chat functionality with private 1-on-1 rooms, allowing two users to collaborate on interactive presentations and 3D graphics in isolated sessions.

## Features

- **Private 1-on-1 Rooms**: Each conversation is isolated with a unique room code
- **Invitation Links**: Share a simple URL to invite someone to your room
- **Room Capacity Control**: Rooms are limited to 2 people for focused collaboration
- **Peer-to-Peer Video Chat**: Direct WebRTC connections between users
- **Collaborative Editing**: Room-scoped code editor and pen strokes
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

### 3. Create a Room and Invite Someone

**Person A (Room Creator):**
1. Open `http://localhost:8000` in your browser
2. Click a project button (e.g., "1029")
3. Allow camera and microphone access when prompted
4. A room will be automatically created with a unique code (e.g., "ABC123")
5. An invitation UI will appear at the top of the screen
6. Click "Copy Link" to copy the invitation URL
7. Share the link with Person B (via chat, email, etc.)

**Person B (Joining):**
1. Click the invitation link shared by Person A
2. Allow camera and microphone access when prompted
3. You'll automatically join Person A's room
4. The peer status will change from "Waiting for peer..." to "Peer connected"

The two users will automatically connect via WebRTC in their private room!

### 4. Multiple Independent Rooms

You can have multiple pairs of people in different rooms simultaneously:
- Person A invites Person B → Room 1 (e.g., `?room=ABC123`)
- Person C invites Person D → Room 2 (e.g., `?room=XYZ789`)
- Each room is completely isolated with separate video, audio, and collaborative editing

## Usage

### Video Controls

Three control buttons appear in the bottom-right corner:

- **📹 Video Toggle**: Turn your camera on/off
- **🎤 Audio Toggle**: Mute/unmute your microphone
- **👁️ Visibility Toggle**: Hide/show all video windows

### Video Layout

- **Your video**: Green border, labeled "You"
- **Remote video**: Your peer's video appears to the left
- **1-on-1 only**: Rooms support exactly 2 people

### Invitation UI

When you create or join a room, an invitation panel appears at the top:
- **Room Code**: Shows your unique 6-character room code (e.g., ABC123)
- **Invitation Link**: The full URL to share with others
- **Copy Link Button**: One-click copy to clipboard
- **Peer Status**: Shows "Waiting for peer...", "Peer connected", or "Peer disconnected"
- **Close Button**: Hide the invitation panel (you can still use the room)

### Room Full Notification

If someone tries to join a room that already has 2 people:
- A notification appears explaining the room is full
- They'll need to request a new invitation link for a different room

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
   - Manages private 1-on-1 rooms with unique codes
   - Relays offer/answer/ICE candidates between peers in same room
   - Enforces 2-person room capacity limit
   - Auto-deletes rooms when empty
   - Scopes all messages (WebRTC signaling, state updates) to room members only

2. **WebRTC Client** (`webrtc-client.js`):
   - Parses room ID from URL query parameter (`?room=ABC123`)
   - Auto-creates new room if no room specified
   - Manages RTCPeerConnection instances per room
   - Handles media stream negotiation
   - Auto-connects to peer in same room (1-on-1)

3. **Video UI** (`video-ui.js`):
   - Creates video elements dynamically
   - Provides toggle controls
   - Manages visibility

4. **Invitation UI** (`main.js`):
   - Shows room code and shareable invitation link
   - Copy-to-clipboard functionality
   - Peer connection status indicator
   - Room full notification modal

5. **Collaborative Editing** (`main.js`):
   - Yjs documents scoped per room (e.g., `bici-code-editor-ABC123`)
   - Code editor changes sync only within same room
   - Pen strokes isolated per room
   - State updates broadcast only to room members

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
2. Verify both users are in the same room (check the room code in invitation UI)
3. Verify both users loaded the same project (e.g., both clicked "1029")
4. Ensure server is running (`npm start`)
5. Try refreshing both browser windows

### Room Full Error

If you see "Room is full" notification:
1. The room already has 2 people
2. Ask the room creator to create a new room
3. Or wait for someone to leave the current room

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

- **Room Privacy**: Rooms are private but not password-protected
  - Anyone with the room link can join (if room isn't full)
  - Room codes are randomly generated (6 alphanumeric characters = ~2 billion possibilities)
  - Rooms auto-delete when empty (no persistence)
- **No Authentication**: No user accounts or login required
- **End-to-End Encryption**: All peer-to-peer connections encrypted by WebRTC
- **Signaling Server**: Only relays connection metadata, never sees media streams
- **Data Isolation**: Each room has completely separate data (video, audio, code, drawings)

## Future Enhancements

Potential additions (not implemented):
- Screen sharing
- Recording functionality
- Chat messages
- Password-protected rooms
- Room persistence (rejoining after disconnect)
- User authentication
- Group rooms (3+ people)
- Mobile app
- TURN server integration for better firewall traversal

## Credits

WebRTC implementation adapted from InsightFlow project.
Integration by Alex Liu for Ken Perlin's BICI platform.

## License

Same as BICI project.
