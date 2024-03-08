import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
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
import { Subscription } from "rxjs";

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
    RouterLink,
    NbSpinnerModule,
  ],
  templateUrl: "./creation-compte.component.html",
  styleUrl: "./creation-compte.component.scss",
})
export class CreationCompteComponent implements OnInit, OnDestroy {
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  currentUserSub!: Subscription;

  constructor(
    private userService: UserService,
    private toastr: NbToastrService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.currentUserSub = this.userService.currentUser$.subscribe((user) => {
      if (user) this.router.navigate(["/"]).then();
    });
  }

  ngOnDestroy() {
    this.currentUserSub.unsubscribe();
  }

  async register(form: NgForm) {
    this.loading = true;

    try {
      await this.userService.register(form.value);
    } catch (e) {
      if (typeof e === "string") this.toastr.danger(e, "Erreur");
      else throw e;
    } finally {
      this.loading = false;
    }
  }
}
