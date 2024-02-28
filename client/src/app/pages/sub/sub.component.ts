import { Component } from '@angular/core';
import {NbCardModule, NbListModule} from '@nebular/theme';

@Component({
  standalone: true,
  imports: [NbCardModule, NbListModule],
  templateUrl: './sub.component.html',
  styleUrl: './sub.component.scss'
})
export class SubComponent {

}
