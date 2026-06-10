function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer, conn, id, data, onReceive, onOpen, remoteId, nSkipped = 0, nFails = 0;

    let relayConfig = {                          // Same servers PeerJS 1.5.2 uses by
       config: {                                 // default, but restricted to the TURN
          iceServers: [                          // relays, for wifi networks that cannot
             { urls: "stun:stun.l.google.com:19302" },          // sustain direct
             { urls: [ "turn:us-0.turn.peerjs.com:3478",        // peer-to-peer UDP
                       "turn:eu-0.turn.peerjs.com:3478" ],      // between clients.
               username: "peerjs", credential: "peerjsp" } ],
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
          conn = c;                              // the channel object needs to initialize
          initConn(conn);                        // some things internally.
       });
    }
    let reconnect = () => {                      // Only the inviting side knows the remote
       if (! remoteId)                           // peer id, so only it can re-establish a
          return;                                // connection whose network path has died.
       console.log('RECONNECTING TO', remoteId); // The receiving side just waits for a new
       let old = conn;                           // invite to arrive.
       conn = null;
       if (old) try { old.close(); } catch (e) {}
       if (++nFails == 2) {                      // If a freshly opened connection has died
          console.log('SWITCHING TO RELAY');     // more than once, the direct network path
          peer.destroy();                        // is unusable, so route all further
          setupPeer(true);                       // traffic through the TURN relay instead.
       }
       setTimeout(() => this.open(remoteId), 1000);
    }
    let initConn = c => {
       c.on('data', d => { data = d; if (onReceive) onReceive(JSON.parse(d)); });
       c.on('close', () => { console.log('CHANNEL CLOSED'); if (conn == c) { conn = null; reconnect(); } });
       c.on('error', err => console.log('CHANNEL ERROR', err));
       c.on('open', () => {                      // The browser will not recover on its own
          let pc = c.peerConnection;             // when the network path dies (e.g. a wifi
          pc.oniceconnectionstatechange = () => {// hiccup on a standalone headset), so on
             console.log('ICE STATE:', pc.iceConnectionState);     // failure the inviting
             if (conn != c)                                        // side opens a fresh
                return;                                            // connection.
             if (pc.iceConnectionState == 'failed' || pc.iceConnectionState == 'closed')
                reconnect();
             if (pc.iceConnectionState == 'disconnected')          // 'disconnected' often
                setTimeout(() => {                                 // never progresses to
                   if (conn == c && pc.iceConnectionState == 'disconnected')   // 'failed',
                      reconnect();                                 // so treat 3 seconds of
                }, 3000);                                          // it as dead.
          };
       });
    }
    setupPeer(false);
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       remoteId = peerId;                        // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
       let connect = () => {                     // CONNECTION. PeerJS requires a local peer
          conn = peer.connect(peerId);           // before connect(); then need to wait for
          initConn(conn);                        // 'open'.
       };
       if (id) connect();                        // Need to register with the broker before
       else peer.on('open', connect);            // connect(); then need to wait for 'open'.
    }
    this.send = data => {                        // Only the latest state matters, so if the
       if (! conn || ! conn.open)                // remote peer has not yet drained earlier
          return;                                // messages, drop this one rather than let
       if (conn.dataChannel.bufferedAmount == 0) // the queue (and latency) grow unboundedly.
          conn.send(JSON.stringify(data));
       else if (++nSkipped % 100 == 1)           // A backlog that never drains means the
          console.log('SEND SKIPPED: bufferedAmount =', conn.dataChannel.bufferedAmount);
    }
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (id) callback(id); };
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
