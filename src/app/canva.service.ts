import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CanvaService {
  socket!: Socket;
  constructor() { 
    // this.connect();
  }

  ngOnInit(): void {
  }

  connect(): void{
    this.socket = io(environment.SOCKET_ENDPOINT);
  }

  joinRoom(roomId: string): void {
    this.socket.emit('join', roomId);
  }

  createRoom(roomId: string): void {
    this.socket.emit('create', roomId);
  }

}
