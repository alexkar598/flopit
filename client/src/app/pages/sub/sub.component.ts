import { Component, ElementRef, ViewChild } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbListModule,
  NbSpinnerModule,
  NbToastrService,
  NbUserModule,
} from "@nebular/theme";
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

  public newDescription: string = "";

  constructor(
    router: Router,
    toastrService: NbToastrService,
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
}
