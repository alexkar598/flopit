import { Component, OnDestroy, OnInit } from "@angular/core";
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
import { filter, map, Observable, Subscription } from "rxjs";
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
export class SubComponent implements OnInit, OnDestroy {
  private sub$!: Observable<SubInformationQuery["subByName"]>;
  private subSubscription!: Subscription;
  private routeSubscription!: Subscription;
  public sub?: SubInformationQuery["subByName"];

  constructor(
    public route: ActivatedRoute,
    private subInfoQuery: SubInformationGQL,
    private followSubMut: FollowSubGQL,
    private unfollowSubMut: UnfollowSubGQL,
  ) {}

  ngOnInit() {
    this.routeSubscription = this.route.paramMap
      .pipe(
        map((route) => route.get("subName")),
        filter((sub) => sub != null),
      )
      .subscribe((subName) => {
        this.subSubscription?.unsubscribe();
        this.sub = null;

        this.sub$ = this.subInfoQuery
          .watch({
            sub_name: subName!,
          })
          .valueChanges.pipe(map((res) => res.data.subByName));

        this.subSubscription = this.sub$.subscribe((sub) => (this.sub = sub));
      });
  }

  ngOnDestroy() {
    this.subSubscription.unsubscribe();
    this.routeSubscription.unsubscribe();
  }

  toggleFollow() {
    if (!this.sub) return;

    const optimisticResponse: UnfollowSubMutation | FollowSubMutation = {
      __typename: "Mutation",
      [this.sub.is_following ? "unfollowSub" : "followSub"]: {
        __typename: "Sub",
        id: this.sub.id,
        is_following: !this.sub.is_following,
        followers: {
          __typename: "SubFollowersConnection",
          totalCount: this.sub.followers.totalCount
            ? this.sub.followers.totalCount + (this.sub.is_following ? -1 : 1)
            : null,
        },
      },
    };

    if (this.sub.is_following)
      this.unfollowSubMut
        .mutate({ input: { subId: this.sub.id } }, { optimisticResponse })
        .subscribe();
    else
      this.followSubMut
        .mutate({ input: { subId: this.sub.id } }, { optimisticResponse })
        .subscribe();
  }
}
