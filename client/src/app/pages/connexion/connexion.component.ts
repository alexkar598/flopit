import { Component } from '@angular/core';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import {NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule} from "@nebular/theme";

@Component({
  standalone: true,
  imports: [NbButtonModule, NbCardModule, NbInputModule, NbFormFieldModule, NbIconModule, NbEvaIconsModule],
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
