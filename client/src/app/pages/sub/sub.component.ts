import { Component, ElementRef, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbListModule,
  NbSpinnerModule,
  NbToastrService,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import { ModeratorListWindowComponent } from "~/app/windows/moderator-list/moderator-list.component";
import {
  EditSubGQL,
  FollowSubGQL,
  FollowSubMutation,
  HomeFeedDocument,
  SubFeedDocument,
  SubInformationGQL,
  SubInformationQuery,
  UnfollowSubGQL,
  UnfollowSubMutation,
} from "~/graphql";
import { ActivatedRoute, Router } from "@angular/router";
import { AsyncPipe } from "@angular/common";
import {
  map,
  distinctUntilChanged,
  switchMap,
  BehaviorSubject,
  tap,
} from "rxjs";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";
import { FormsModule } from "@angular/forms";

@Component({
  standalone: true,
  imports: [
    NbCardModule,
    NbListModule,
    NbIconModule,
    NbButtonModule,
    AsyncPipe,
    NbUserModule,
    TopPostListComponent,
    NbSpinnerModule,
    FormsModule,
    NbActionsModule,
  ],
  templateUrl: "./sub.component.html",
  styleUrl: "./sub.component.scss",
})
export class SubComponent {
  public sub$ = new BehaviorSubject<SubInformationQuery["subByName"] | null>(
    null,
  );

  public editing: boolean = false;
  private loading = false;
  icon: File | null = null;
  banner: File | null = null;

  public newDescription: string = "";

  constructor(
    router: Router,
    toastrService: NbToastrService,
    protected windowService: NbWindowService,
    public route: ActivatedRoute,
    private subInfoQuery: SubInformationGQL,
    private followSubMut: FollowSubGQL,
    private unfollowSubMut: UnfollowSubGQL,
    private editSubMut: EditSubGQL,
  ) {
    this.route.paramMap
      .pipe(
        map((x) => x.get("subName")!),
        distinctUntilChanged(),
        switchMap(
          (subName) =>
            this.subInfoQuery.watch({
              sub_name: subName,
            }).valueChanges,
        ),
        map((res) => res.data.subByName),
        tap((sub) => {
          if (sub == null) {
            toastrService.danger(
              "Cette communauté n'a pas pu être trouvée",
              "Communauté introuvée!",
            );
            void router.navigate(["/"]);
          }
        }),
        takeUntilDestroyed(),
      )
      .subscribe(this.sub$);
  }

  toggleFollow() {
    const sub = this.sub$.getValue();
    if (!sub) return;

    const optimisticResponse: UnfollowSubMutation | FollowSubMutation = {
      __typename: "Mutation",
      [sub.isFollowing ? "unfollowSub" : "followSub"]: {
        __typename: "Sub",
        id: sub.id,
        isFollowing: !sub.isFollowing,
        followers: {
          __typename: "SubFollowersConnection",
          totalCount:
            (sub.followers.totalCount ?? 0) + (sub.isFollowing ? -1 : 1),
        },
      },
    };

    if (sub.isFollowing)
      this.unfollowSubMut
        .mutate({ input: { subId: sub.id } }, { optimisticResponse })
        .subscribe();
    else
      this.followSubMut
        .mutate({ input: { subId: sub.id } }, { optimisticResponse })
        .subscribe();

    this.editing = false;
  }

  editDescription() {
    const sub = this.sub$.getValue();
    if (!sub) return;

    this.editing = !this.editing;
    if (this.editing) this.newDescription = sub.description;
  }

  saveDescription() {
    const sub = this.sub$.getValue();
    if (!sub) return;

    this.editDescription();

    this.loading = true;
    this.editSubMut
      .mutate(
        {
          input: {
            id: sub.id,
            banner: this.banner ?? undefined,
            icon: this.icon ?? undefined,
            description: this.newDescription,
          },
        },
        {
          optimisticResponse: {
            editSub: {
              ...sub,
              description: this.newDescription,
            },
          },
        },
      )
      .subscribe(async (res) => {
        this.loading = false;
        if (res.errors) return;
      });
  }

  openModeratorsWindow() {
    const sub = this.sub$.getValue()?.id;
    if (sub == null) return;

    this.windowService.open(ModeratorListWindowComponent, {
      title: "Gérer modérateurs",
      windowClass: "moderators-window",
      closeOnEsc: false,
      context: { sub },
    });
  }

  onIconChange(input: any) {
    const file = (input as HTMLInputElement)?.files?.[0];
    if (!file) return;

    this.icon = file;
  }

  onBannerChange(input: any) {
    const file = (input as HTMLInputElement)?.files?.[0];
    if (!file) return;

    this.banner = file;
  }
}
