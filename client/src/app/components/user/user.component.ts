import { booleanAttribute, Component, DestroyRef, Input } from "@angular/core";
import { NbComponentSize, NbUserModule } from "@nebular/theme";
import { RouterLink } from "@angular/router";
import { UserService } from "~/app/services/user.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { map, shareReplay } from "rxjs";
import { notNull } from "~/app/util";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: "app-user",
  standalone: true,
  imports: [NbUserModule, RouterLink, AsyncPipe],
  templateUrl: "./user.component.html",
  styleUrl: "./user.component.scss",
})
export class UserComponent {
  @Input()
  public size: NbComponentSize = "medium";

  @Input({ transform: booleanAttribute })
  public noLink = false;

  @Input({ required: true })
  public user!:
    | {
        id: string;
        username: string;
        avatarUrl?: string | null | undefined;
      }
    | null
    | undefined;

  protected isLoggedIn = this.userService.currentUser$.pipe(
    takeUntilDestroyed(this.destroyRef),
    map(notNull),
    shareReplay(1),
  );

  constructor(
    private userService: UserService,
    private destroyRef: DestroyRef,
  ) {}
}
