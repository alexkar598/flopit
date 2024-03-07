import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
} from "@nebular/theme";

@Component({
  selector: "app-creation-compte",
  standalone: true,
  imports: [
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbFormFieldModule,
    NbIconModule,
    NbEvaIconsModule,
    FormsModule,
  ],
  templateUrl: "./creation-compte.component.html",
  styleUrl: "./creation-compte.component.scss",
})
export class CreationCompteComponent {
  showPassword = false;

  getInputType() {
    if (this.showPassword) {
      return "text";
    }
    return "password";
  }

  toggleShowPassword() {
    this.showPassword = !this.showPassword;
  }
}
