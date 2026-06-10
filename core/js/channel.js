function Channel() {                             // DIRECT DATA CHANNEL BETWEEN WEB CLIENTS.
    let peer = new Peer(), conn, id, data, onReceive, onOpen;
    peer.on('open', i => { id = i; if (onOpen) onOpen(i); });
    peer.on('connection', c => {                 // When I receive an invite from a remote
       console.log('RECEIVED CONNECTION INVITE');
       conn = c;                                 // the channel object needs to initialize
       conn.on('open', () => {});                // some things internally.
       conn.on('data', d => { data = d; if (onReceive) onReceive(JSON.parse(d)); });
    });
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       let connect = () => {                     // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
          conn = peer.connect(peerId);           // CONNECTION. PeerJS requires a local peer
          conn.on('data', d => { data = d; if (onReceive) onReceive(JSON.parse(d)); });
       };
       if (id) connect();                        // Need to register with the broker before
       else peer.on('open', connect);            // connect(); then need to wait for 'open'.
    }
    this.send = data => { if (conn && conn.open) conn.send(JSON.stringify(data)); }
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (id) callback(id); };
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
