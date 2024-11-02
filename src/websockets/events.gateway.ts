import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Result } from '../races/result.entity';

@WebSocketGateway()
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: any) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: any) {
    console.log(`Client disconnected: ${client.id}`);
  }

  emitRoundResults(roundId: number, results: Result[]) {
    this.server.emit('raceResults', {
      roundId,
      results: results.map((res) => ({
        horseId: res.horse.id,
        position: res.position,
        time: res.time,
      })),
    });
  }
}
