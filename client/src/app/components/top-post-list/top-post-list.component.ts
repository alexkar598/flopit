import { CommonModule } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { ApolloQueryResult } from "@apollo/client";
import { NbCardModule, NbListModule } from "@nebular/theme";
import { BehaviorSubject, map, Observable } from "rxjs";
import { notNull, throwException } from "~/app/util";
import { HomeFeedGQL, SubFeedGQL, TopPostCardFragment } from "~/graphql";
import { PostSingleComponent } from "~/app/components/post-single/post-single.component";

@Component({
  selector: "app-post-list",
  standalone: true,
  imports: [NbListModule, NbCardModule, CommonModule, PostSingleComponent],
  templateUrl: "./top-post-list.component.html",
  styleUrl: "./top-post-list.component.scss",
})
export class TopPostListComponent implements OnInit {
  @Input()
  subName?: string;

  public posts$!: Observable<TopPostCardFragment[]>;
  public loadMore!: () => Promise<ApolloQueryResult<unknown>>;
  constructor(
    private homeFeedQuery: HomeFeedGQL,
    private subFeedQuery: SubFeedGQL,
  ) {}

  ngOnInit(): void {
    this.resetQuery();
  }

  resetQuery() {
    const endCursor = new BehaviorSubject<string | null | undefined>(null);

    if (this.subName != null) {
      const feedQuery = this.subFeedQuery.watch({ sub_name: this.subName }, {});
      const sub$ = feedQuery.valueChanges;
      sub$
        .pipe(map((x) => x.data.subByName?.posts.pageInfo.endCursor))
        .subscribe(endCursor.next);
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
            cursor: endCursor.getValue(),
          },
        });
    } else {
      const feedQuery = this.homeFeedQuery.watch({}, {});
      const sub$ = feedQuery.valueChanges;
      sub$
        .pipe(map((x) => x.data.homefeed.pageInfo.endCursor))
        .subscribe(endCursor.next);
      this.posts$ = sub$.pipe(
        map(
          (x) =>
            x.data.homefeed.edges.map((x) => x?.node).filter(notNull) ?? null,
        ),
      );
      this.loadMore = () =>
        feedQuery.fetchMore({
          variables: {
            cursor: endCursor.getValue(),
          },
        });
    }
  }
}
