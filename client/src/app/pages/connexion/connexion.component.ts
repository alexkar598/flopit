import { Component, OnInit } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { RouterLink } from "@angular/router";
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
import { Router } from "@angular/router";

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
    RouterLink,
  ],
  templateUrl: "./connexion.component.html",
  styleUrl: "./connexion.component.scss",
})
export class ConnexionComponent implements OnInit {
  showPassword = false;
  loading = false;

  constructor(
    private userService: UserService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$.subscribe((user) => {
      if (user) this.router.navigate(["/"]).then();
    });
  }

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

    await this.userService
      .login(form.value.email, form.value.password)
      .finally(() => (this.loading = false));
  }
}
