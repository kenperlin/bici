function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer, conns = [], id, data, onReceive, onOpen, remoteId;
    let nSkipped = 0, nFails = 0, lastHeard = 0, lastWarn = 0;

    let relayConfig = {                          // Same relay servers PeerJS 1.5.2 uses by
       config: {                                 // default, but as the only route, for wifi
          iceServers: [                          // networks that cannot sustain direct
             { urls: "stun:stun.l.google.com:19302" },          // peer-to-peer traffic
             { urls: [ "turn:us-0.turn.peerjs.com:3478",        // between clients. The
                       "turn:us-0.turn.peerjs.com:3478?transport=tcp",  // tcp variants
                       "turn:eu-0.turn.peerjs.com:3478",        // survive networks that
                       "turn:eu-0.turn.peerjs.com:3478?transport=tcp" ],// drop long-lived
               username: "peerjs", credential: "peerjsp" } ],   // UDP flows entirely.
          iceTransportPolicy: 'relay'
       }
    };
    let setupPeer = useRelay => {
       id = undefined;
       peer = useRelay ? new Peer(relayConfig) : new Peer();
       peer.on('open', i => { id = i; if (onOpen) onOpen(i); });
       let p = peer;
       peer.on('disconnected', () => {           // If the socket to the broker drops (e.g.
          console.log('BROKER DISCONNECTED');    // the page was hidden for a while), restore
          if (! p.destroyed)                     // it, since reconnecting to a remote peer
             p.reconnect();                      // requires a live broker connection.
       });
       peer.on('connection', c => {              // When I receive an invite from a remote
          console.log('RECEIVED CONNECTION INVITE');
          addConn(c);                            // the channel object needs to initialize
       });                                       // some things internally.
    }
    let reconnect = () => {                      // Only the inviting side knows the remote
       if (! remoteId)                           // peer id, so only it can re-establish a
          return;                                // connection whose network path has died.
       console.log('RECONNECTING TO', remoteId); // The receiving side just waits for a new
       let old = conns;                          // invite to arrive.
       conns = [];
       for (let c of old) try { c.close(); } catch (e) {}
       if (++nFails == 2) {                      // If a freshly opened connection has died
          console.log('SWITCHING TO RELAY');     // more than once, the direct network path
          peer.destroy();                        // is unusable, so route all further
          setupPeer(true);                       // traffic through the relay instead.
       }
       setTimeout(() => this.open(remoteId), 1000);
    }
    let addConn = c => {                         // A channel can serve several remote
       conns.push(c);                            // clients at once (e.g. a VR client on a
       c.on('data', d => {                       // desktop and another in a headset), so
          let msg = JSON.parse(d);               // keep every open connection, and remove
          if (msg.type == '_hb') {               // a connection when it closes. Heartbeats
             lastHeard = Date.now();             // are consumed here: they only exist to
             return;                             // prove that the other side is alive and
          }                                      // to keep the network path warm.
          data = d;
          if (onReceive) onReceive(msg);
       });
       c.on('close', () => {
          console.log('CHANNEL CLOSED');
          if (! conns.includes(c))               // Already replaced by a reconnect, which
             return;                             // is what closed it in the first place.
          conns = conns.filter(x => x != c);
          if (conns.length == 0) reconnect();
       });
       c.on('error', err => console.log('CHANNEL ERROR', err));
       c.on('open', () => {                      // The browser will not recover on its own
          lastHeard = Date.now();                // when the network path dies (e.g. a wifi
          let pc = c.peerConnection;             // hiccup on a standalone headset), so on
          pc.oniceconnectionstatechange = () => {// failure the inviting side opens a fresh
             console.log('ICE STATE:', pc.iceConnectionState);     // connection.
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
    let sendStr = str => {                       // Only the latest state matters, so if the
       for (let c of conns) {                    // remote peer has not yet drained earlier
          if (! c.open)                          // messages, drop this one rather than let
             continue;                           // the queue (and latency) grow unboundedly.
          if (c.dataChannel.bufferedAmount == 0)
             c.send(str);
          else if (++nSkipped % 100 == 1)        // A backlog that never drains means the
             console.log('SEND SKIPPED: bufferedAmount =', c.dataChannel.bufferedAmount);
       }
    }
    setupPeer(false);
    setInterval(() => {                          // Once per second, each side sends a tiny
       if (conns.length == 0)                    // heartbeat, which both keeps the network
          return;                                // path warm and proves to the other side
       sendStr(JSON.stringify({ type: '_hb' })); // (visibly, on its console) that messages
       let silent = Date.now() - lastHeard;      // are actually getting through.
       if (silent > 5000 && Date.now() - lastWarn > 5000) {
          lastWarn = Date.now();
          console.log('NO HEARTBEAT FROM REMOTE FOR', silent/1000>>0, 'SECONDS');
          if (remoteId)                          // A channel that says it is open but is
             reconnect();                        // silent is dead: get a fresh connection.
       }
    }, 1000);
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       remoteId = peerId;                        // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
       let connect = () => {                     // CONNECTION. PeerJS requires a local peer
          addConn(peer.connect(peerId));         // before connect(); then need to wait for
       };                                        // 'open'.
       if (id) connect();                        // Need to register with the broker before
       else peer.on('open', connect);            // connect(); then need to wait for 'open'.
    }
    this.send = data => sendStr(JSON.stringify(data));
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (id) callback(id); };
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
