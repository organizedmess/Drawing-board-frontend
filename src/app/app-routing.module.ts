import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import path from 'path';
import { LobbyComponent } from './lobby/lobby.component';
import { BoardComponent } from './board/board.component';

const routes: Routes = [
  {path: '', component: LobbyComponent},
  {path: 'room/:mode/:id', component: BoardComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
