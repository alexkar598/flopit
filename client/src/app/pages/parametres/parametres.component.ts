import { Component } from "@angular/core";

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbTooltipModule,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";
import { AsyncPipe, NgOptimizedImage } from "@angular/common";
import { UserService } from "~/app/services/user.service";
import { FormsModule } from "@angular/forms";
import { EditUserGQL } from "~/graphql";
import { Router } from "@angular/router";
import { YesNoPopupComponent } from "~/app/components/yes-no-popup/yes-no-popup.component";
import { filter } from "rxjs";

@Component({
  selector: "app-parametres",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    TopPostListComponent,
    NbSelectModule,
    NbTooltipModule,
    AsyncPipe,
    NbUserModule,
    NgOptimizedImage,
    NbInputModule,
    FormsModule,
    NbFormFieldModule,
  ],
  templateUrl: "./parametres.component.html",
  styleUrl: "./parametres.component.scss",
})
export class ParametresComponent {
  showPassword = false;
  showConfirmPassword = false;
  deletingAccount = false;

  constructor(
    public userService: UserService,
    private editUserGql: EditUserGQL,
    private windowService: NbWindowService,
    private router: Router,
  ) {}

  async changer(values: { username: string }) {
    console.log(values);
    const { username } = values;
    this.editUserGql
      .mutate({
        input: {
          username,
        },
      })
      .subscribe();
  }

  toggleDeletingAccount() {
    const windowRef = this.windowService.open(YesNoPopupComponent, {
      title: "Suppression du compte",
    });
    windowRef.onClose
      .pipe(filter((res: boolean) => res))
      .subscribe((res) => this.deleteAccount());
  }

  deleteAccount() {
    void this.userService.delete();
    void this.router.navigate(["/"]);
  }
}
