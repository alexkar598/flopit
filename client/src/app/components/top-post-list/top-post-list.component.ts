import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { ApolloQueryResult } from "@apollo/client";
import {
  NbCardModule,
  NbListModule,
  NbSelectModule,
  NbToggleModule,
  NbTooltipModule,
} from "@nebular/theme";
import { BehaviorSubject, map, Observable } from "rxjs";
import { notNull, throwException } from "~/app/util";
import {
  HomeFeedGQL,
  PostSortOptions,
  PostSortType,
  SubFeedGQL,
  TopPostCardFragment,
} from "~/graphql";
import { PostSingleComponent } from "~/app/components/post-single/post-single.component";
import { FormsModule } from "@angular/forms";
import { UserService } from "~/app/services/user.service";

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
export class TopPostListComponent implements OnInit {
  @Input({ required: true })
  subName: string | null = null;
  sortOptions: PostSortOptions = { type: PostSortType.Hot };
  personalised: boolean = false;

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

  resetQuery() {
    const endCursor = new BehaviorSubject<string | null | undefined>(null);

    if (this.subName != null) {
      const feedQuery = this.subFeedQuery.watch(
        { sub_name: this.subName, sortOptions: this.sortOptions, cursor: null },
        {},
      );
      const sub$ = feedQuery.valueChanges;
      sub$
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
        feedQuery.fetchMore({
          variables: {
            sortOptions: this.sortOptions,
            cursor: endCursor.getValue(),
          },
        });
    } else {
      const feedQuery = this.homeFeedQuery.watch(
        {
          sortOptions: this.sortOptions,
          ignoreFollows: !this.personalised,
          cursor: null,
        },
        { fetchPolicy: "cache-and-network" },
      );
      const sub$ = feedQuery.valueChanges;
      sub$
        .pipe(map((x) => x.data.homefeed.pageInfo.endCursor))
        .subscribe(endCursor);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.homefeed.edges.map((x) => x?.node).filter(notNull) ?? null,
        ),
      );
      this.loadMore = () =>
        feedQuery.fetchMore({
          variables: {
            sortOptions: this.sortOptions,
            ignoreFollows: !this.personalised,
            cursor: endCursor.getValue(),
          },
        });
    }
  }
}
