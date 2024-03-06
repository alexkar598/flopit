import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";

@Component({
  standalone: true,
  imports: [
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbFormFieldModule,
    NbIconModule,
    NbEvaIconsModule,
    FormsModule,
    NbSpinnerModule,
  ],
  templateUrl: "./connexion.component.html",
  styleUrl: "./connexion.component.scss",
})
export class ConnexionComponent {
  showPassword = false;
  loading = false;

  constructor(private userService: UserService) {}

  getInputType() {
    if (this.showPassword) {
      return "text";
    }
    return "password";
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }

  async login(form: NgForm) {
    this.loading = true;

    this.userService
      .login(form.value.email, form.value.password)
      .finally(() => (this.loading = false));
  }
}
