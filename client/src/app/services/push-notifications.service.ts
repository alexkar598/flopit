import { Injectable } from "@angular/core";
import { SwPush } from "@angular/service-worker";
import {
  PushNotificationsInfoGQL,
  SubscribePushNotificationsGQL,
  UnsubscribePushNotificationsGQL,
} from "~/graphql";
import { BehaviorSubject, filter, Subject, take } from "rxjs";
import { buf2hex, notNull } from "~/app/util";
import { NbToastrService } from "@nebular/theme";

@Injectable({
  providedIn: "root",
})
export class PushNotificationsService {
  private publicKey = new BehaviorSubject<string | null>(null);
  public subscription = new BehaviorSubject<PushSubscription | null>(null);

  constructor(
    private subscribeGQL: SubscribePushNotificationsGQL,
    private unsubscribeGQL: UnsubscribePushNotificationsGQL,
    private swPush: SwPush,
    private toastr: NbToastrService,
    infoGQL: PushNotificationsInfoGQL,
  ) {
    swPush.subscription.subscribe(this.subscription);
    infoGQL.fetch().subscribe((val) => {
      if (val.data) this.publicKey.next(val.data.pushNotificationsPublicKey);
    });
  }

  public enableNotifications() {
    this.publicKey.pipe(filter(notNull), take(1)).subscribe((publicKey) => {
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
    this.subscription
      .pipe(take(1), filter(notNull))
      .subscribe(({ endpoint }) => {
        this.unsubscribeGQL.mutate({ input: { endpoint } }).subscribe();
        void this.swPush.unsubscribe();
      });
  }
}
