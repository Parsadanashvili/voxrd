import { Server as IOServer } from "socket.io";
import Peer from "./Peer";

class VoiceChannel {
  declare id: string;
  declare server_id: string;
  declare peers: Map<string, Peer>;
  declare io: IOServer;

  constructor(id: string, server_id: string, io: IOServer) {
    this.id = id;
    this.server_id = server_id;
    this.io = io;
  }

  addPeer(peer: Peer) {
    this.peers.set(peer.id, peer);
  }

  getPeers() {
    return this.peers;
  }

  getPeersCount() {
    return this.peers.size;
  }
}
