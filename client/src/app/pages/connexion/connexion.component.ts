import { Component } from '@angular/core';
import {NbButtonModule, NbCardModule, NbInputModule} from "@nebular/theme";

@Component({
  standalone: true,
  imports: [NbButtonModule, NbCardModule, NbInputModule],
  templateUrl: './connexion.component.html',
  styleUrl: './connexion.component.scss'
})
export class ConnexionComponent {

}
