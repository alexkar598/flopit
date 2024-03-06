import { Component, Input,OnInit } from '@angular/core';

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule
} from "@nebular/theme";

@Component({

  selector: 'app-accueil',
  standalone: true,
  imports: [NbCardModule, NbIconModule, NbButtonGroupModule, NbButtonModule, NbUserModule],
  templateUrl: './accueil.component.html',
  styleUrl: './accueil.component.scss'
})
export class AccueilComponent {
}

