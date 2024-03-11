import { CommonModule } from "@angular/common";
import { Component, Input, OnDestroy, OnInit } from "@angular/core";
import { ApolloQueryResult, makeVar } from "@apollo/client";
import {
  NbCardModule,
  NbListModule,
  NbSelectModule,
  NbToggleModule,
  NbTooltipModule,
} from "@nebular/theme";
import { BehaviorSubject, map, Observable, Subscription } from "rxjs";
import { notNull, throwException } from "~/app/util";
import {
  HomeFeedGQL,
  HomeFeedQuery,
  HomeFeedQueryVariables,
  PostSortOptions,
  PostSortType,
  SubFeedGQL,
  SubFeedQuery,
  SubFeedQueryVariables,
  TopPostCardFragment,
} from "~/graphql";
import { PostSingleComponent } from "~/app/components/post-single/post-single.component";
import { FormsModule } from "@angular/forms";
import { UserService } from "~/app/services/user.service";
import { QueryRef } from "apollo-angular";

@Component({
  selector: "app-post-list",
  standalone: true,
  imports: [
    NbListModule,
    NbCardModule,
    CommonModule,
    PostSingleComponent,
    NbSelectModule,
    FormsModule,
    NbToggleModule,
    NbTooltipModule,
  ],
  templateUrl: "./top-post-list.component.html",
  styleUrl: "./top-post-list.component.scss",
})
export class TopPostListComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  subName: string | null = null;
  sortOptions: PostSortOptions = { type: PostSortType.Hot };
  personalised: boolean = false;
  cursorSubscription?: Subscription;
  feedQuery!:
    | QueryRef<SubFeedQuery, SubFeedQueryVariables>
    | QueryRef<HomeFeedQuery, HomeFeedQueryVariables>;

  public posts$!: Observable<TopPostCardFragment[]>;
  public loadMore!: () => Promise<ApolloQueryResult<unknown>>;

  protected readonly PostSortType = PostSortType;

  constructor(
    private homeFeedQuery: HomeFeedGQL,
    private subFeedQuery: SubFeedGQL,
    public userService: UserService,
  ) {}

  ngOnInit(): void {
    this.resetQuery();
  }

  ngOnDestroy(): void {
    this.cursorSubscription?.unsubscribe();
  }

  applyVariables() {
    this.feedQuery.variables.cursor = null;
    if (this.subName == null)
      (<HomeFeedQueryVariables>this.feedQuery.variables).ignoreFollows =
        !this.personalised;

    this.feedQuery.refetch();
  }

  resetQuery() {
    this.cursorSubscription?.unsubscribe();

    const endCursor = new BehaviorSubject<string | null | undefined>(null);

    if (this.subName != null) {
      this.feedQuery = this.subFeedQuery.watch(
        { sub_name: this.subName, sortOptions: this.sortOptions, cursor: null },
        {},
      );
      const sub$ = this.feedQuery.valueChanges;
      this.cursorSubscription = sub$
        .pipe(map((x) => x.data.subByName?.posts.pageInfo.endCursor))
        .subscribe(endCursor);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.subByName?.posts.edges.map((x) => x?.node).filter(notNull) ??
            throwException(Error("subName invalide")),
        ),
      );
      this.loadMore = () =>
        this.feedQuery.fetchMore({
          variables: {
            sortOptions: this.sortOptions,
            cursor: endCursor.getValue(),
          },
        });
    } else {
      this.feedQuery = this.homeFeedQuery.watch({
        sortOptions: this.sortOptions,
        ignoreFollows: !this.personalised,
        cursor: null,
      });
      const sub$ = this.feedQuery.valueChanges;
      this.cursorSubscription = sub$
        .pipe(map((x) => x.data.homefeed.pageInfo.endCursor))
        .subscribe(endCursor);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.homefeed.edges.map((x) => x?.node).filter(notNull) ?? null,
        ),
      );
      this.loadMore = () =>
        this.feedQuery.fetchMore({
          variables: {
            sortOptions: this.sortOptions,
            ignoreFollows: !this.personalised,
            cursor: endCursor.getValue(),
          },
        });
    }
  }
}
