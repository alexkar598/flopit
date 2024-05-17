import { AsyncPipe, isPlatformBrowser } from "@angular/common";
import { Component, Inject, isDevMode, PLATFORM_ID } from "@angular/core";
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbPopoverModule,
} from "@nebular/theme";
import { combineLatestWith, map, shareReplay } from "rxjs";
import { PushNotificationsService } from "~/app/services/push-notifications.service";
import { notNull } from "~/app/util";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-notifications",
  standalone: true,
  imports: [
    AsyncPipe,
    NbActionsModule,
    NbButtonModule,
    NbPopoverModule,
    RelativeDatePipe,
    NbCardModule,
    RouterLink,
  ],
  templateUrl: "./notifications.component.html",
  styleUrl: "./notifications.component.scss",
})
export class NotificationsComponent {
  constructor(
    protected pushNotifications: PushNotificationsService,
    @Inject(PLATFORM_ID) private platformId: Object,
  ) {}

  protected set open(value: boolean) {
    this.pushNotifications.resetLastRead$.next(value);
  }

  protected pushNotificationsEnabled =
    this.pushNotifications.subscription$.pipe(map(notNull), shareReplay(1));

  protected notificationsAvailable = this.pushNotificationsEnabled.pipe(
    combineLatestWith(this.pushNotifications.newNotifications$),
    map(
      ([notificationsEnabled, notificationsAvailable]) =>
        (!isDevMode() &&
          isPlatformBrowser(this.platformId) &&
          !notificationsEnabled) ||
        notificationsAvailable,
    ),
  );
}
