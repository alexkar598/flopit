import { CommonModule } from "@angular/common";
import {
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
} from "@angular/core";
import { ApolloQueryResult } from "@apollo/client";
import {
  NbCardModule,
  NbListModule,
  NbSelectModule,
  NbToggleModule,
  NbTooltipModule,
} from "@nebular/theme";
import { BehaviorSubject, filter, map, Observable, Subscription } from "rxjs";
import { notNull, throwException } from "~/app/util";
import {
  HomeFeedGQL,
  PostSortOptions,
  PostSortType,
  SubFeedGQL,
  TopPostCardFragment,
} from "~/graphql";
import { TopPostComponent } from "~/app/components/top-post/top-post.component";
import { FormsModule } from "@angular/forms";
import { UserService } from "~/app/services/user.service";
import { TopPostListItemComponent } from "~/app/components/top-post-list-item/top-post-list-item.component";

@Component({
  selector: "app-top-post-list",
  standalone: true,
  imports: [
    NbListModule,
    NbCardModule,
    CommonModule,
    TopPostComponent,
    NbSelectModule,
    FormsModule,
    NbToggleModule,
    NbTooltipModule,
    TopPostListItemComponent,
  ],
  templateUrl: "./top-post-list.component.html",
  styleUrl: "./top-post-list.component.scss",
})
export class TopPostListComponent implements OnInit, OnChanges, OnDestroy {
  @Input({ required: true })
  subName: string | null = null;
  sortOptions: PostSortOptions = { type: PostSortType.Hot };
  personalised: boolean = false;
  cursorSubscription?: Subscription;

  public posts$!: Observable<TopPostCardFragment[]>;
  public loadMore!: () => Promise<ApolloQueryResult<unknown>>;
  public applyVariables!: () => Promise<unknown>;

  protected readonly PostSortType = PostSortType;

  constructor(
    private homeFeedQuery: HomeFeedGQL,
    private subFeedQuery: SubFeedGQL,
    public userService: UserService,
  ) {}

  ngOnInit(): void {
    this.resetQuery();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (
      !changes?.["subName"]?.firstChange &&
      changes?.["subName"]?.previousValue !== changes?.["subName"]?.currentValue
    )
      void this.applyVariables();
  }

  ngOnDestroy(): void {
    this.cursorSubscription?.unsubscribe();
  }

  resetQuery() {
    this.cursorSubscription?.unsubscribe();

    const endCursor = new BehaviorSubject<string | null | undefined>(null);

    if (this.subName != null) {
      const getVariables = (withCursor = true) => ({
        sub_name: this.subName!,
        sortOptions: this.sortOptions,
        cursor: withCursor ? endCursor.getValue() : null,
      });
      const feedQuery = this.subFeedQuery.watch(getVariables(), {
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
      });
      const sub$ = feedQuery.valueChanges;
      this.cursorSubscription = sub$
        .pipe(
          filter((x) => x.data.subByName?.posts.pageInfo.hasNextPage ?? false),
          map((x) => x.data.subByName?.posts.pageInfo.endCursor),
        )
        .subscribe(endCursor);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.subByName?.posts.edges.map((x) => x?.node).filter(notNull) ??
            throwException(Error("subName invalide")),
        ),
      );
      this.loadMore = () => feedQuery.fetchMore({ variables: getVariables() });
      this.applyVariables = () => feedQuery.refetch(getVariables(false));
    } else {
      const getVariables = (withCursor = true) => ({
        sortOptions: this.sortOptions,
        ignoreFollows: !this.personalised,
        cursor: withCursor ? endCursor.getValue() : null,
      });
      const feedQuery = this.homeFeedQuery.watch(getVariables(), {
        fetchPolicy: "cache-and-network",
        nextFetchPolicy: "cache-first",
      });
      const sub$ = feedQuery.valueChanges;
      this.cursorSubscription = sub$
        .pipe(
          filter((x) => x.data.homefeed.pageInfo.hasNextPage),
          map((x) => x.data.homefeed.pageInfo.endCursor),
        )
        .subscribe(endCursor);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.homefeed.edges.map((x) => x?.node).filter(notNull) ?? null,
        ),
      );
      this.loadMore = () => feedQuery.fetchMore({ variables: getVariables() });
      this.applyVariables = () => feedQuery.refetch(getVariables(false));
    }
  }
}
