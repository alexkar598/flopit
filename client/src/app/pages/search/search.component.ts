import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, Observable, switchMap } from "rxjs";
import { isFragment } from "~/app/util";
import {
  SearchPostsCommentFragment,
  SearchPostsGQL,
  SearchPostsTopPostFragment,
} from "~/graphql";

@Component({
  standalone: true,
  imports: [AsyncPipe],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchPageComponent {
  protected resultsTopPosts$: Observable<SearchPostsTopPostFragment[]>;
  protected resultsComments$: Observable<SearchPostsCommentFragment[]>;

  constructor(searchPosts: SearchPostsGQL, route: ActivatedRoute) {
    const results$ = route.paramMap.pipe(
      map((x) => x.get("query")!),
      switchMap((query) => searchPosts.watch({ query }).valueChanges),
      map((x) => x.data),
    );
    this.resultsTopPosts$ = results$.pipe(
      map((x) =>
        x.topPosts.edges.map((x) => x?.node).filter(isFragment("TopPost")),
      ),
    );
    this.resultsComments$ = results$.pipe(
      map((x) =>
        x.comments.edges.map((x) => x?.node).filter(isFragment("Comment")),
      ),
    );
  }

  protected readonly JSON = JSON;
}
