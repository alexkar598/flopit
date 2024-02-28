import { Component } from '@angular/core';
import {NbButtonModule, NbCardModule, NbIconModule, NbListModule} from '@nebular/theme';

@Component({
  standalone: true,
  imports: [NbCardModule, NbListModule, NbIconModule, NbButtonModule],
  templateUrl: "./sub.component.html",
  styleUrl: "./sub.component.scss",
})
export class SubComponent {}
