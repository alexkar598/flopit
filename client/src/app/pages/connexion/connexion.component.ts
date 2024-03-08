import { Component, OnDestroy, OnInit } from "@angular/core";
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
  NbToastrService,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { Router } from "@angular/router";
import { Subscription } from "rxjs";

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
export class ConnexionComponent implements OnInit, OnDestroy {
  showPassword = false;
  loading = false;
  currentUserSub!: Subscription;

  constructor(
    private userService: UserService,
    private router: Router,
    private toastr: NbToastrService,
  ) {}

  ngOnInit(): void {
    this.currentUserSub = this.userService.currentUser$.subscribe((user) => {
      if (user) this.router.navigate(["/"]).then();
    });
  }

  ngOnDestroy() {
    this.currentUserSub.unsubscribe();
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

    try {
      await this.userService.login(form.value.email, form.value.password);
    } catch (e) {
      if (typeof e === "string") this.toastr.danger(e, "Erreur");
      else throw e;
    } finally {
      this.loading = false;
    }
  }
}
