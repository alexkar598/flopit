import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { map, Observable, shareReplay, switchMap } from "rxjs";
import { isFragment, notNull } from "~/app/util";
import {
  GlobalSearchGQL,
  GlobalSearchSubFragment,
  GlobalSearchUserFragment,
  SearchPostsCommentFragment,
  SearchPostsGQL,
  SearchPostsTopPostFragment,
} from "~/graphql";
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbTabsetModule,
  NbUserModule,
} from "@nebular/theme";
import { TopPostListItemComponent } from "~/app/components/top-post-list-item/top-post-list-item.component";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { RichTextComponent } from "~/app/components/rich-text/rich-text.component";
import { VoteComponent } from "~/app/components/vote/vote.component";

@Component({
  standalone: true,
  imports: [
    AsyncPipe,
    NbTabsetModule,
    RouterLink,
    TopPostListItemComponent,
    NbCardModule,
    NbUserModule,
    RelativeDatePipe,
    RichTextComponent,
    NbButtonModule,
    NbIconModule,
    VoteComponent,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchPageComponent {
  protected resultsTopPosts$: Observable<SearchPostsTopPostFragment[]>;
  protected resultsComments$: Observable<SearchPostsCommentFragment[]>;
  protected resultsUsers$: Observable<GlobalSearchUserFragment[]>;
  protected resultsSubs$: Observable<GlobalSearchSubFragment[]>;
  protected currentTab$: Observable<string>;

  constructor(
    searchPostsGQL: SearchPostsGQL,
    searchGQL: GlobalSearchGQL,
    protected route: ActivatedRoute,
    protected router: Router,
  ) {
    const resultsPosts$ = route.paramMap.pipe(
      map((x) => x.get("query")!),
      switchMap((query) => searchPostsGQL.watch({ query }).valueChanges),
      map((x) => x.data),
    );
    this.resultsTopPosts$ = resultsPosts$.pipe(
      map((x) =>
        x.topPosts.edges.map((x) => x?.node).filter(isFragment("TopPost")),
      ),
    );
    this.resultsComments$ = resultsPosts$.pipe(
      map((x) =>
        x.comments.edges.map((x) => x?.node).filter(isFragment("Comment")),
      ),
    );
    const results$ = route.paramMap.pipe(
      map((x) => x.get("query")!),
      switchMap((query) => searchGQL.watch({ query }).valueChanges),
      map((x) => x.data),
    );
    this.resultsUsers$ = results$.pipe(
      map((x) => x?.users.edges.map((x) => x?.node).filter(notNull)),
    );
    this.resultsSubs$ = results$.pipe(
      map((x) => {
        const subsByName = x.subsByName.edges
          .map((x) => x?.node)
          .filter(notNull);
        const subsByDescription = x.subsByDescription.edges
          .map((x) => x?.node)
          .filter(notNull);
        return [...new Set(subsByName.concat(subsByDescription))];
      }),
    );
    this.currentTab$ = route.paramMap.pipe(
      map((x) => x.get("tab")!),
      shareReplay(1),
    );
  }
}
