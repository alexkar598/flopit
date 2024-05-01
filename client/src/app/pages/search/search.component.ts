import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import {
  BehaviorSubject,
  map,
  Observable,
  shareReplay,
  switchMap,
  tap,
} from "rxjs";
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
  NbSpinnerModule,
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
    NbSpinnerModule,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchPageComponent {
  protected resultsTopPosts$: Observable<SearchPostsTopPostFragment[]>;
  protected resultsComments$: Observable<SearchPostsCommentFragment[]>;
  protected resultsUsers$: Observable<GlobalSearchUserFragment[]>;
  protected resultsSubs$: Observable<GlobalSearchSubFragment[]>;
  protected loadingPosts$ = new BehaviorSubject(false);
  protected loading$ = new BehaviorSubject(false);
  protected currentTab$: Observable<string>;

  constructor(
    searchPostsGQL: SearchPostsGQL,
    searchGQL: GlobalSearchGQL,
    protected route: ActivatedRoute,
    protected router: Router,
  ) {
    const resultsPosts$ = route.paramMap.pipe(
      tap(() => this.loadingPosts$.next(true)),
      map((x) => x.get("query")!),
      switchMap((query) => searchPostsGQL.watch({ query }).valueChanges),
      map((x) => x.data),
      tap(() => this.loadingPosts$.next(false)),
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
      tap(() => this.loading$.next(true)),
      map((x) => x.get("query")!),
      switchMap((query) => searchGQL.watch({ query }).valueChanges),
      map((x) => x.data),
      tap(() => this.loading$.next(false)),
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
