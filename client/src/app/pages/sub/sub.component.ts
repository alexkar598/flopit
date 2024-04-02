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
import { Observable, map, Subscription } from "rxjs";
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
  public sub?: SubInformationQuery["subByName"];

  constructor(
    public route: ActivatedRoute,
    private subInfoQuery: SubInformationGQL,
    private followSubMut: FollowSubGQL,
    private unfollowSubMut: UnfollowSubGQL,
  ) {}

  ngOnInit() {
    this.sub$ = this.subInfoQuery
      .watch({
        sub_name: this.route.snapshot.params?.["subName"],
      })
      .valueChanges.pipe(map((res) => res.data.subByName));

    this.subSubscription = this.sub$.subscribe((sub) => (this.sub = sub));
  }

  ngOnDestroy() {
    this.subSubscription.unsubscribe();
  }

  toggleFollow() {
    if (!this.sub) return;

    const optimisticResponse: UnfollowSubMutation | FollowSubMutation = {
      __typename: "Mutation",
      [this.sub.isFollowing ? "unfollowSub" : "followSub"]: {
        __typename: "Sub",
        id: this.sub.id,
        isFollowing: !this.sub.isFollowing,
        followers: {
          __typename: "SubFollowersConnection",
          totalCount: this.sub.followers.totalCount
            ? this.sub.followers.totalCount + (this.sub.isFollowing ? -1 : 1)
            : null,
        },
      },
    };

    if (this.sub.isFollowing)
      this.unfollowSubMut
        .mutate({ input: { subId: this.sub.id } }, { optimisticResponse })
        .subscribe();
    else
      this.followSubMut
        .mutate({ input: { subId: this.sub.id } }, { optimisticResponse })
        .subscribe();
  }
}
