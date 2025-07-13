// src/chat/chat.gateway.ts
import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', // frontend origin
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly chatService: ChatService) {}

  private onlineUsers = new Map<string, string>(); // socket.id -> userId

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.onlineUsers.set(client.id, userId);
      console.log(`🟢 ${userId} connected`);
    } else {
      console.log('❌ Missing userId, disconnecting...');
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.onlineUsers.get(client.id);
    this.onlineUsers.delete(client.id);
    console.log(`🔌 ${userId} disconnected`);
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { receiverId: string; content: string },
  ) {
    const senderId = this.onlineUsers.get(client.id);
    if (!senderId) return;

    const saved = await this.chatService.saveMessage(
      senderId,
      payload.receiverId,
      payload.content,
    );

    // Emit to receiver if they are online
    const receiverSocketId = [...this.onlineUsers.entries()].find(
      ([, uid]) => uid === payload.receiverId,
    )?.[0];

    if (receiverSocketId) {
      client.to(receiverSocketId).emit('receive_message', {
        ...saved,
        sender: { userId: senderId },
      });
    }

    // Also send it back to sender for confirmation
    client.emit('receive_message', {
      ...saved,
      sender: { userId: senderId },
    });
  }
}
