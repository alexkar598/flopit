import { Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import {
  NewNotificationsGQL,
  NotificationFragment,
  OldNotificationsGQL,
  PushNotificationsInfoGQL,
  SubscribePushNotificationsGQL,
  UnsubscribePushNotificationsGQL,
} from "~/graphql";
import {
  BehaviorSubject,
  combineLatest,
  concat,
  filter,
  map,
  sample,
  scan,
  shareReplay,
  switchMap,
  take,
} from "rxjs";
import { buf2hex, notNull } from "~/app/util";
import { NbToastrService } from "@nebular/theme";
import { UserService } from "~/app/services/user.service";

const LOCAL_STORAGE_LAST_READ_NOTIFICATION_KEY = "lastReadNotification";

@Injectable({
  providedIn: "root",
})
export class PushNotificationsService {
  private publicKey$ = new BehaviorSubject<string | null>(null);
  public subscription$ = new BehaviorSubject<PushSubscription | null>(null);
  public notifications$ = this.userService.currentUser$.pipe(
    switchMap(() =>
      concat(
        this.oldNotificationsGQL.fetch().pipe(
          map((x) => x.data?.currentUser?.notifications.edges),
          filter(notNull),
          switchMap((x) => x),
          filter(notNull),
          map((x) => x.node),
        ),
        this.newNotificationsGQL.subscribe().pipe(
          map((x) => x.data?.watchNotifications),
          filter(notNull),
        ),
      ).pipe(
        scan(
          (acc, value) =>
            value.id == acc.at(0)?.id ? acc : [value, ...acc].slice(0, 5),
          new Array<NotificationFragment>(),
        ),
        shareReplay(1),
      ),
    ),
  );

  public resetLastRead$ = new BehaviorSubject(false);
  private lastRead$ = new BehaviorSubject(
    window.localStorage.getItem(LOCAL_STORAGE_LAST_READ_NOTIFICATION_KEY) ?? "",
  );
  public newNotifications$ = combineLatest([
    this.notifications$,
    this.lastRead$,
    this.resetLastRead$,
  ]).pipe(
    map(
      ([notifications, lastRead, resetLastRead]) =>
        !resetLastRead && (notifications.at(0)?.id ?? "") > lastRead,
    ),
  );

  constructor(
    private subscribeGQL: SubscribePushNotificationsGQL,
    private unsubscribeGQL: UnsubscribePushNotificationsGQL,
    private oldNotificationsGQL: OldNotificationsGQL,
    private newNotificationsGQL: NewNotificationsGQL,
    private swPush: SwPush,
    private toastr: NbToastrService,
    private userService: UserService,
    infoGQL: PushNotificationsInfoGQL,
  ) {
    swPush.subscription.subscribe(this.subscription$);
    infoGQL.fetch().subscribe((val) => {
      if (val.data) this.publicKey$.next(val.data.pushNotificationsPublicKey);
    });

    this.notifications$
      .pipe(sample(this.resetLastRead$.pipe(filter((x) => !x))))
      .subscribe((notifications) => {
        const lastRead = notifications.at(0)?.id ?? "";
        this.lastRead$.next(lastRead);
        window.localStorage.setItem(
          LOCAL_STORAGE_LAST_READ_NOTIFICATION_KEY,
          lastRead,
        );
      });
  }

  public enableNotifications() {
    this.publicKey$.pipe(filter(notNull), take(1)).subscribe((publicKey) => {
      this.swPush
        .requestSubscription({ serverPublicKey: publicKey })
        .then((value) =>
          this.subscribeGQL
            .mutate({
              input: {
                auth: buf2hex(value.getKey("auth")!),
                p256dh: buf2hex(value.getKey("p256dh")!),
                endpoint: value.endpoint,
                expirationTime:
                  value.expirationTime == null
                    ? null
                    : new Date(value.expirationTime).toISOString(),
              },
            })
            .subscribe(),
        )
        .catch((e) => {
          this.toastr.danger(e, "Erreur en activant les notifications");
        });
    });
  }

  public disableNotifications() {
    this.subscription$
      .pipe(take(1), filter(notNull))
      .subscribe(({ endpoint }) => {
        this.unsubscribeGQL.mutate({ input: { endpoint } }).subscribe();
        void this.swPush.unsubscribe();
      });
  }
}
