import { Component } from '@angular/core';
import {NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule} from "@nebular/theme";

@Component({
  standalone: true,
  imports: [NbButtonModule, NbCardModule, NbInputModule, NbFormFieldModule, NbIconModule],
  templateUrl: './connexion.component.html',
  styleUrl: './connexion.component.scss'
})
export class ConnexionComponent {
  showPassword = false;

  getInputType() {
    if (this.showPassword) {
      return 'text';
    }
    return 'password';
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
