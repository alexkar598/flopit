import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbClickableMenuItem,
  NbContextMenuModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbToastrService,
  NbUserModule,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { GetImgPipe } from "~/app/pipes/get-img.pipe";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    NbButtonModule,
    NbFormFieldModule,
    NbIconModule,
    NbEvaIconsModule,
    FormsModule,
    NbInputModule,
    NbUserModule,
    GetImgPipe,
    RouterLink,
    NbContextMenuModule,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  constructor(
    public userService: UserService,
    public toastr: NbToastrService,
    private router: Router,
  ) {}

  public userMenuItems: NbClickableMenuItem[] = [
    {
      title: "Créer une communauté",
      icon: "globe-2-outline",
      data: {
        onClick: (async () => {
          await this.router.navigate(["/f"]);
        }).bind(this),
      },
    },
    {
      title: "Déconnexion",
      icon: "log-out",
      data: {
        onClick: () => this.userService.logout(),
      },
    },
  ];
}
