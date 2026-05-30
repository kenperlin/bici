// A CHANNEL OBJECT BUILDS A ONE-TO-ONE TWO-WAY DATA CONNECTION BETWEEN REMOTE WEB CLIENTS.

function Channel() {
    let peer = new Peer(), conn, id, data, onReceive;
    peer.on('open', i => id = i);
    peer.on('connection', c => {                 // When I receive an invite from a remote
       console.log('RECEIVED CONNECTION INVITE');
       conn = c;                                 // channel object, I need to initialize
       conn.on('open', () => {});                // some things internally.
       conn.on('data', d => { data = d; if (onReceive) onReceive(d); });
    });
    this.open = peerId => {                      // INVITE A CHANNEL OBJECT WITHIN A REMOTE
       conn = peer.connect(peerId);              // CLIENT TO INITIATE A ONE-TO-ONE TWO-WAY
       conn.on('data', d => { data = d; if (onReceive) onReceive(d); });
    }
    this.send = data => {                        // SEND DATA ACROSS THE CHANNEL.
       if (conn && conn.open)
          conn.send(data);
    }
    this.onReceive = callback => onReceive = callback;
    this.data = () => data;
    this.id = () => id;                          // MY ID TELLS THE OTHER CHANNEL WHERE TO
}                                                // SEND THE INVITE TO OPEN A CONNECTION.
