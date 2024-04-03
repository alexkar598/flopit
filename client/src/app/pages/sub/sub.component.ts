import { Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbListModule,
  NbSpinnerModule,
  NbUserModule,
} from "@nebular/theme";
import {
  FollowSubGQL,
  FollowSubMutation,
  SubInformationGQL,
  SubInformationQuery,
  UnfollowSubGQL,
  UnfollowSubMutation,
} from "~/graphql";
import { ActivatedRoute } from "@angular/router";
import { AsyncPipe } from "@angular/common";
import { map, distinctUntilChanged, switchMap, BehaviorSubject } from "rxjs";
import { GetImgPipe } from "~/app/pipes/get-img.pipe";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";

@Component({
  standalone: true,
  imports: [
    NbCardModule,
    NbListModule,
    NbIconModule,
    NbButtonModule,
    AsyncPipe,
    NbUserModule,
    GetImgPipe,
    TopPostListComponent,
    NbSpinnerModule,
  ],
  templateUrl: "./sub.component.html",
  styleUrl: "./sub.component.scss",
})
export class SubComponent {
  public sub$ = new BehaviorSubject<SubInformationQuery["subByName"] | null>(
    null,
  );

  constructor(
    public route: ActivatedRoute,
    private subInfoQuery: SubInformationGQL,
    private followSubMut: FollowSubGQL,
    private unfollowSubMut: UnfollowSubGQL,
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
        takeUntilDestroyed(),
      )
      .subscribe(this.sub$);
  }

  toggleFollow() {
    const sub = this.sub$.getValue();
    if (!sub) return;

    const optimisticResponse: UnfollowSubMutation | FollowSubMutation = {
      __typename: "Mutation",
      [sub.is_following ? "unfollowSub" : "followSub"]: {
        __typename: "Sub",
        id: sub.id,
        is_following: !sub.is_following,
        followers: {
          __typename: "SubFollowersConnection",
          totalCount: sub.followers.totalCount
            ? sub.followers.totalCount + (sub.is_following ? -1 : 1)
            : null,
        },
      },
    };

    if (sub.is_following)
      this.unfollowSubMut
        .mutate({ input: { subId: sub.id } }, { optimisticResponse })
        .subscribe();
    else
      this.followSubMut
        .mutate({ input: { subId: sub.id } }, { optimisticResponse })
        .subscribe();
  }
}
