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
import { CreateSubGQL } from "~/graphql";
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
  ],
  templateUrl: "./creation-sub.component.html",
  styleUrl: "./creation-sub.component.scss",
})
export class CreationSubComponent {
  public loading = false;

  constructor(
    private createSubMut: CreateSubGQL,
    private toastr: NbToastrService,
    private router: Router,
  ) {}

  async createSub(f: NgForm) {
    if (!f.value.name) {
      this.toastr.danger("La communauté doit avoir un nom", "Erreur");
      return;
    }

    this.loading = true;

    this.createSubMut
      .mutate({
        input: { name: f.value.name, description: f.value.description },
      })
      .subscribe(async (res) => {
        this.loading = false;
        if (res.errors) return;
        await this.router.navigate(["f", f.value.name]);
      });
  }
}
