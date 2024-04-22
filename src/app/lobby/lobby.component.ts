import { MatSnackBar } from '@angular/material/snack-bar';
import { Component } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { CanvaService } from '../canva.service';
import { Socket } from 'socket.io-client';

uuidv4();


@Component({
  selector: 'app-lobby',
  templateUrl: './lobby.component.html',
  styleUrl: './lobby.component.css'
})
export class LobbyComponent {
  roomId = '';
  socket!: Socket;

  constructor(
    private snackbar: MatSnackBar, 
    private router: Router, 
    private socketService: CanvaService
    ) {}

  joinRoom() {
    if(this.roomId == '') {
      this.snackbar.open('Please enter a valid room ID', '',  { duration: 2000 });
      return;
    }
    this.roomId = this.roomId.trim();

    this.router.navigate(['/room', 'join', this.roomId]);
  }

  createRoom() {
    const uuid = uuidv4();
    console.log(uuid);

    this.router.navigate(['/room', 'create', uuid]);
  }

}
