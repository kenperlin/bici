// A CHANNEL OBJECT BUILDS A ONE-TO-ONE TWO-WAY DATA CONNECTION BETWEEN REMOTE WEB CLIENTS.

function Channel() {
    let peer = new Peer(), conn, id, data, onReceive, onOpen;
    peer.on('open', i => { id = i; if (onOpen) onOpen(i); });
    peer.on('connection', c => {                 // When I receive an invite from a remote
       console.log('RECEIVED CONNECTION INVITE');
       conn = c;                                 // channel object, I need to initialize
       conn.on('open', () => {});                // some things internally.
       conn.on('data', d => { data = d; if (onReceive) onReceive(d); });
    });
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       let connect = () => {                     // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
          conn = peer.connect(peerId);           // CONNECTION. PeerJS requires the local peer
          conn.on('data', d => { data = d; if (onReceive) onReceive(d); });
       };
       if (id) connect();                        // to be registered with the broker before
       else peer.on('open', connect);            // connect(); wait for 'open' if it is not yet.
    }
    this.send = data => {                        // SEND DATA ACROSS THE CHANNEL.
       if (conn && conn.open)
          conn.send(data);
    }
    this.onReceive = callback => onReceive = callback;
    this.onOpen = callback => { onOpen = callback; if (id) callback(id); };
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
