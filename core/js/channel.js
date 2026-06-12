function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer, conns = [], id, address, data, onReceive, onOpen, remoteId;
    let relay = null, relayAlive = false, relayStarted = false, transport = '';
    let nSkipped = 0, lastHeard = 0, rtcLastHeard = 0, lastWarn = 0, logLines = [];

    let log = (...args) => {                     // Everything the channel logs is also
       console.log(...args);                     // mirrored to the inviting side's web
       logLines.push(args.join(' '));            // server (the /log route), so that what
    }                                            // happens inside a headset shows up in
    setInterval(() => {                          // the terminal running its server. The
       if (logLines.length == 0 || ! remoteId)   // receiving side (bici) does not report:
          return;                                // its own console is already visible.
       let form = new FormData();
       form.append('log', 'CHANNEL: ' + logLines.join('\nCHANNEL: '));
       logLines = [];
       fetch('/log', { method: 'POST', body: form }).catch(() => {});
    }, 3000);

    let receive = (str, viaRtc) => {             // Messages arrive over whichever transport
       lastHeard = Date.now();                   // is currently working: the WebRTC data
       if (viaRtc)                               // channel, or the websocket relay through
          rtcLastHeard = Date.now();             // the server.
       let msg = JSON.parse(str);
       if (msg.type == '_hb')                    // Heartbeats are consumed here: they only
          return;                                // exist to prove the other side is alive
       data = str;                               // and to keep the network path warm.
       if (onReceive) onReceive(msg);
    }
    let reportPath = pc => {                     // Report which kind of network route ICE
       pc.getStats().then(stats => {             // actually picked (host = direct on the
          let S = {};                            // local network, srflx = direct through
          stats.forEach(s => S[s.id] = s);       // NAT, relay = TURN server), since that
          stats.forEach(s => {                   // is the first thing to know when a path
             if (s.type == 'candidate-pair' && s.nominated && s.state == 'succeeded') {
                let l = S[s.localCandidateId], r = S[s.remoteCandidateId];
                if (l && r)                      // The addresses matter as much as the
                   log('PATH:',                  // type: they reveal when ICE picked an
                       l.candidateType + '/' + l.protocol,                // odd interface
                       (l.address || l.ip || '?') + ':' + l.port, '->',  // (IPv6, VPN,
                       r.candidateType,                                  // AWDL) for one
                       (r.address || r.ip || '?') + ':' + r.port);       // peer pairing.
             }                                   // works briefly and then dies.
          });
       }).catch(() => {});
    }

    // THE WEBSOCKET RELAY: A TCP PATH THROUGH THE SERVER, FOR WHEN WEBRTC CANNOT
    // STAY ALIVE. BOTH SIDES KEEP IT CONNECTED, SO FAILOVER IS IMMEDIATE.

    let openRelay = (urls, room) => {
       if (relayStarted) return;
       relayStarted = true;
       let n = 0;
       let tryNext = () => {
          if (relayAlive) return;
          let url = urls[n++ % urls.length], ws;
          try { ws = new WebSocket(url + '?room=' + room); }
          catch (e) { setTimeout(tryNext, 3000); return; }
          let opened = false;
          ws.onopen = () => { opened = true; relayAlive = true; relay = ws; log('RELAY CONNECTED:', url); };
          ws.onmessage = e => receive(e.data, false);
          ws.onerror = () => {};                 // A close event always follows an error.
          ws.onclose = () => {
             if (relay == ws) { relayAlive = false; relay = null; log('RELAY CLOSED'); }
             setTimeout(tryNext, opened ? 1000 : 500);
          };
       };
       tryNext();
    }
    let setupPeer = () => {
       id = undefined;
       peer = new Peer();
       peer.on('open', i => {
          id = i;
          fetch('/api/netinfo')                  // My address is my peer id plus, if my
             .then(r => r.ok ? r.json() : null)  // own server offers the relay, the relay
             .catch(() => null)                  // urls a peer on another device can reach
             .then(info => {                     // it at.
                address = id;
                if (info && info.ips) {
                   for (let ip of info.ips)
                      address += '|ws://' + ip + ':' + info.port + '/relay';
                   openRelay([(location.protocol == 'https:' ? 'wss://' : 'ws://')
                              + location.host + '/relay'], id);
                }
                if (onOpen) onOpen(address);
             });
       });
       let p = peer;
       peer.on('error', err => log('PEER ERROR:', err.type));
       peer.on('disconnected', () => {           // If the socket to the broker drops (e.g.
          log('BROKER DISCONNECTED');            // the page was hidden for a while), restore
          if (! p.destroyed)                     // it, since reconnecting to a remote peer
             p.reconnect();                      // requires a live broker connection.
       });
       peer.on('connection', c => {              // When I receive an invite from a remote
          log('RECEIVED CONNECTION INVITE');     // the channel object needs to initialize
          addConn(c);                            // some things internally.
       });
    }
    let reconnect = () => {                      // Only the inviting side knows the remote
       if (! remoteId)                           // peer id, so only it can re-establish a
          return;                                // connection whose network path has died.
       log('RECONNECTING TO', remoteId);         // The receiving side just waits for a new
       let old = conns;                          // invite to arrive.
       conns = [];
       for (let c of old) try { c.close(); } catch (e) {}
       setTimeout(() => this.open(remoteId), 1000);
    }
    let addConn = c => {                         // A channel can serve several remote
       conns.push(c);                            // clients at once (e.g. a VR client on a
       c.on('data', d => receive(d, true));      // desktop and another in a headset), so
       c.on('close', () => {                     // keep every open connection, and remove
          log('CHANNEL CLOSED');                 // a connection when it closes.
          if (! conns.includes(c))               // Already replaced by a reconnect, which
             return;                             // is what closed it in the first place.
          conns = conns.filter(x => x != c);
          if (conns.length == 0) reconnect();
       });
       c.on('error', err => log('CHANNEL ERROR', err));
       c.on('open', () => {                      // The browser will not recover on its own
          log('CHANNEL OPEN');                   // when the network path dies (e.g. a wifi
          lastHeard = rtcLastHeard = Date.now(); // hiccup on a standalone headset), so on
          let pc = c.peerConnection;             // failure the inviting side opens a fresh
          reportPath(pc);                        // connection.
          pc.oniceconnectionstatechange = () => {
             log('ICE STATE:', pc.iceConnectionState);
             if (pc.iceConnectionState == 'disconnected')
                reportPath(pc);                  // Show which route was active at death.
             if (! conns.includes(c))
                return;
             if (pc.iceConnectionState == 'failed' || pc.iceConnectionState == 'closed')
                reconnect();
             if (pc.iceConnectionState == 'disconnected')          // 'disconnected' often
                setTimeout(() => {                                 // never progresses to
                   if (conns.includes(c) && pc.iceConnectionState == 'disconnected')
                      reconnect();                                 // 'failed', so treat 3
                }, 3000);                                          // seconds of it as dead.
          };
       });
    }
    let sendStr = str => {                       // Send over WebRTC when it is open and
       let sent = false;                         // drained; otherwise fall back to the
       for (let c of conns) {                    // relay. Only the latest state matters,
          if (! c.open)                          // so a message that cannot go out right
             continue;                           // now is dropped rather than queued.
          if (c.dataChannel.bufferedAmount == 0) {
             c.send(str);
             sent = true;
          }
          else if (++nSkipped % 100 == 1)
             log('SEND SKIPPED: bufferedAmount =', c.dataChannel.bufferedAmount);
       }
       let t = sent ? 'webrtc' : relayAlive ? 'relay' : '';
       if (! sent && relayAlive)
          relay.send(str);
       if (t && t != transport)                  // Make transitions between the fast path
          log('SENDING VIA', (transport = t).toUpperCase());       // and the relay visible.
    }
    setupPeer();
    let pad = 'x'.repeat(300);                   // Four times per second, each side sends a
    setInterval(() => {                          // padded heartbeat. Standalone headsets put
       if (conns.length == 0 && ! relayAlive) {  // their wifi radio to sleep between sparse
          lastHeard = rtcLastHeard = Date.now(); // small packets, which kills the connection
          return;                                // seconds after each handshake burst, so
       }                                         // keep the link busy enough to stay awake.
       sendStr(JSON.stringify({ type: '_hb', pad }));
       if (conns.length > 0 && remoteId &&       // A WebRTC connection that says it is open
           Date.now() - rtcLastHeard > 5000 &&   // but is silent is dead: get a fresh one.
           Date.now() - lastWarn > 5000) {       // Data may still be flowing over the
          lastWarn = Date.now();                 // relay; this only revives the fast path.
          log('NO HEARTBEAT OVER WEBRTC FOR', (Date.now() - rtcLastHeard)/1000>>0, 'SECONDS');
          reconnect();
       }
    }, 250);
    this.open = arg => {                         // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       let parts = arg.trim().split('|');        // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
       remoteId = parts[0];                      // CONNECTION. THE REMOTE ADDRESS IS ITS
       if (parts.length > 1)                     // PEER ID, OPTIONALLY FOLLOWED BY RELAY
          openRelay(parts.slice(1), remoteId);   // URLS ON WHICH ITS SERVER CAN BE REACHED.
       let connect = () => {
          addConn(peer.connect(remoteId));       // PeerJS requires a local peer before
       };                                        // connect(); then need to wait for 'open'.
       if (id) connect();
       else peer.on('open', connect);
    }
    this.send = data => sendStr(JSON.stringify(data));
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (address) callback(address); };
    this.data = () => data;
    this.id = () => id;
    this.address = () => address;                // MY ADDRESS TELLS THE OTHER CHANNEL WHERE
}                                                // TO SEND THE INVITE, AND WHERE MY RELAY IS.