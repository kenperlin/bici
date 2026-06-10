function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer = new Peer(), conn, id, data, onReceive, onOpen;
    peer.on('open', i => { id = i; if (onOpen) onOpen(i); });
    let initConn = () => {
       conn.on('data', d => { data = d; if (onReceive) onReceive(JSON.parse(d)); });
       conn.on('close', () => { console.log('CHANNEL CLOSED'); conn = null; });
       conn.on('error', err => console.log('CHANNEL ERROR', err));
    }
    peer.on('connection', c => {                 // When I receive an invite from a remote
       console.log('RECEIVED CONNECTION INVITE');
       conn = c;                                 // the channel object needs to initialize
       conn.on('open', () => {});                // some things internally.
       initConn();
    });
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       let connect = () => {                     // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
          conn = peer.connect(peerId);           // CONNECTION. PeerJS requires a local peer
          initConn();                            // before connect(); then wait for 'open'.
       };
       if (id) connect();                        // Need to register with the broker before
       else peer.on('open', connect);            // connect(); then need to wait for 'open'.
    }
    this.send = data => {                        // Only the latest state matters, so if the
       if (conn && conn.open &&                  // remote peer has not yet drained earlier
           conn.dataChannel.bufferedAmount == 0) // messages, drop this one rather than let
          conn.send(JSON.stringify(data));       // the queue (and latency) grow unboundedly.
    }
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (id) callback(id); };
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
