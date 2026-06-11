function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer, conns = [], id, data, onReceive, onOpen, remoteId;
    let nSkipped = 0, lastHeard = 0, lastWarn = 0, logLines = [];

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

    let reportPath = pc => {                     // Report which kind of network route ICE
       pc.getStats().then(stats => {             // actually picked (host = direct on the
          let S = {};                            // local network, srflx = direct through
          stats.forEach(s => S[s.id] = s);       // NAT, relay = TURN server), since that
          stats.forEach(s => {                   // is the first thing to know when a path
             if (s.type == 'candidate-pair' && s.nominated && s.state == 'succeeded') {
                let l = S[s.localCandidateId], r = S[s.remoteCandidateId];
                if (l && r)
                   log('PATH:', l.candidateType + '/' + l.protocol, '->', r.candidateType);
             }                                   // works briefly and then dies.
          });
       }).catch(() => {});
    }
    let setupPeer = () => {
       id = undefined;
       peer = new Peer();
       peer.on('open', i => { id = i; if (onOpen) onOpen(i); });
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
          log('CHANNEL CLOSED');
          if (! conns.includes(c))               // Already replaced by a reconnect, which
             return;                             // is what closed it in the first place.
          conns = conns.filter(x => x != c);
          if (conns.length == 0) reconnect();
       });
       c.on('error', err => log('CHANNEL ERROR', err));
       c.on('open', () => {                      // The browser will not recover on its own
          log('CHANNEL OPEN');                   // when the network path dies (e.g. a wifi
          lastHeard = Date.now();                // hiccup on a standalone headset), so on
          let pc = c.peerConnection;             // failure the inviting side opens a fresh
          reportPath(pc);                        // connection.
          pc.oniceconnectionstatechange = () => {
             log('ICE STATE:', pc.iceConnectionState);
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
             log('SEND SKIPPED: bufferedAmount =', c.dataChannel.bufferedAmount);
       }
    }
    setupPeer();
    let pad = 'x'.repeat(300);                   // Four times per second, each side sends a
    setInterval(() => {                          // padded heartbeat. Standalone headsets put
       if (conns.length == 0)                    // their wifi radio to sleep between sparse
          return;                                // small packets, which kills the connection
       sendStr(JSON.stringify({ type: '_hb', pad })); // seconds after each handshake burst,
       let silent = Date.now() - lastHeard;      // so keep the link busy enough to stay
       if (silent > 5000 && Date.now() - lastWarn > 5000) {  // awake. It also proves to the
          // other side (visibly, on its console) that messages are getting through.
          lastWarn = Date.now();
          log('NO HEARTBEAT FROM REMOTE FOR', silent/1000>>0, 'SECONDS');
          if (remoteId)                          // A channel that says it is open but is
             reconnect();                        // silent is dead: get a fresh connection.
       }
    }, 250);
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
