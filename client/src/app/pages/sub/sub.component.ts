import { Component } from '@angular/core';
import {NbCardModule, NbIconModule, NbListModule} from '@nebular/theme';

@Component({
  standalone: true,
  imports: [NbCardModule, NbListModule, NbIconModule],
  templateUrl: './sub.component.html',
  styleUrl: './sub.component.scss'
})
export class SubComponent {

}
