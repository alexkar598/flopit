import { CommonModule, isPlatformBrowser } from "@angular/common";
import {
  ChangeDetectionStrategy,
  Component,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbActionsModule,
  NbButtonModule,
  NbClickableMenuItem,
  NbContextMenuModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbPopoverModule,
  NbUserModule,
} from "@nebular/theme";
import { SearchComponent } from "~/app/components/search/search.component";
import { ThemeService } from "~/app/services/theme.service";
import { UserService } from "~/app/services/user.service";
import { Theme } from "~/graphql";
import { SwPush } from "@angular/service-worker";
import { PushNotificationsService } from "~/app/services/push-notifications.service";
import { map, shareReplay } from "rxjs";
import { notNull } from "~/app/util";

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
    NbActionsModule,
    NbPopoverModule,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  constructor(
    public userService: UserService,
    public themeService: ThemeService,
    private router: Router,
    protected pushNotifications: PushNotificationsService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  protected pushNotificationsEnabled = this.pushNotifications.subscription.pipe(
    map(notNull),
    shareReplay(1),
  );

  protected notificationsAvailable = this.pushNotificationsEnabled.pipe(
    map((x) => isPlatformBrowser(this.platformId) && x == null),
  );

  public userMenuItems: NbClickableMenuItem[] = [
    {
      title: "Chat",
      icon: "message-circle-outline",
      link: "chat",
    },
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
