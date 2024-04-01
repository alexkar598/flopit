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
  NbToastrService,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { Router } from "@angular/router";
import { CreateSubInput } from "~/graphql";

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
  templateUrl: "./creation-sub.component.html",
  styleUrl: "./creation-sub.component.scss",
})
export class CreationSubComponent {
  loading = false;

  constructor(
    //private createSubMut:
    private userService: UserService,
    private toastr: NbToastrService,
    private router: Router,
  ) {}

  async createSub(f: NgForm) {
    const { name, description, icon, banner } = f.value;
    console.log(name, description, icon, banner);

    if (!name) {
      this.toastr.danger("Le f/ doit avoir un nom", "Erreur");
      return;
    }

    this.loading = true;

    try {
      await this.create({ description, name });
    } catch (e) {
      if (typeof e === "string") this.toastr.danger(e, "Erreur");
      else throw e;
    } finally {
      this.loading = false;
    }
  }

  create(input: CreateSubInput): Promise<void> {
    return new Promise((resolve, reject) => {});
    // return new Promise((resolve, reject) => {
    //   if (!input.email || !input.username || !input.password) {
    //     return reject("Tous les champs sont obligatoires");
    //   }
    //
    //   this.createUserMut.mutate({ input }).subscribe(async (res) => {
    //     if (res.errors)
    //       return reject(res.errors.map((err) => err.message).join("\n"));
    //     await this.login(input.email, input.password);
    //     return resolve();
    //   });
    // });
  }
}
