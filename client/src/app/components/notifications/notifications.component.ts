import { AsyncPipe, isPlatformBrowser } from "@angular/common";
import { Component, Inject, PLATFORM_ID } from "@angular/core";
import {
  NbActionsModule,
  NbButtonModule,
  NbPopoverModule,
} from "@nebular/theme";
import { map, shareReplay } from "rxjs";
import { PushNotificationsService } from "~/app/services/push-notifications.service";
import { notNull } from "~/app/util";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [AsyncPipe, NbActionsModule, NbButtonModule, NbPopoverModule],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.scss",
})
export class NotificationsComponent {
  constructor(
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
}
