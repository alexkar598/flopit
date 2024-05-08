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
import { SearchComponent } from "~/app/components/search/search.component";
import { ThemeService } from "~/app/services/theme.service";
import { UserService } from "~/app/services/user.service";
import { Theme } from "~/graphql";

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
    RouterLink,
    NbContextMenuModule,
    SearchComponent,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    public toastr: NbToastrService,
    private router: Router,
  ) {}

  public userMenuItems: NbClickableMenuItem[] = [
    {
      title: "Créer une communauté",
      icon: "globe-2-outline",
      data: {
        onClick: () => this.router.navigate(["/f"]),
      },
    },
    {
      title: "Basculer thème",
      icon: "color-palette-outline",
      data: {
        onClick: () =>
          this.themeService.changeTheme(
            this.themeService.currentTheme$.getValue() === Theme.Light
              ? Theme.Dark
              : Theme.Light,
          ),
      },
    },
    {
      title: "Paramètres",
      icon: "settings-2-outline",
      data: {
        onClick: (async () => {
          await this.router.navigate(["/parametres"]);
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
