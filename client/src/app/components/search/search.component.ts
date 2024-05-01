import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
  NbUserModule,
} from "@nebular/theme";
import {
  BehaviorSubject,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import { notNull } from "~/app/util";
import {
  GlobalSearchGQL,
  GlobalSearchSubFragment,
  GlobalSearchUserFragment,
} from "~/graphql";

@Component({
  selector: "app-search",
  standalone: true,
  imports: [
    FormsModule,
    NbButtonModule,
    NbFormFieldModule,
    NbIconModule,
    NbInputModule,
    NbAutocompleteModule,
    AsyncPipe,
    NbUserModule,
    NbSpinnerModule,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchComponent {
  protected searchValue$ = new BehaviorSubject<string>("");
  protected selectValue$ = new Subject<["user" | "sub", string] | "">();

  protected resultsLoading$ = new BehaviorSubject(false);
  protected resultsUsers$: Observable<GlobalSearchUserFragment[] | null>;
  protected resultsSubs$: Observable<GlobalSearchSubFragment[] | null>;

  constructor(searchGQL: GlobalSearchGQL, router: Router) {
    const results$ = this.searchValue$.pipe(
      debounceTime(100),
      tap(() => this.resultsLoading$.next(true)),
      switchMap((query) =>
        query.trim().length === 0
          ? of(null)
          : searchGQL.watch({ query }).valueChanges,
      ),
      map((x) => x?.data),
      tap(() => this.resultsLoading$.next(false)),
    );
    this.resultsUsers$ = results$.pipe(
      map((x) => x?.users.edges.map((x) => x?.node).filter(notNull)),
      map((x) => (x && x.length > 0 ? x : null)),
    );
    this.resultsSubs$ = results$.pipe(
      map((x) => {
        if (x == null) return x;
        const subsByName = x.subsByName.edges
          .map((x) => x?.node)
          .filter(notNull);
        const subsByDescription = x.subsByDescription.edges
          .map((x) => x?.node)
          .filter(notNull);
        return [...new Set(subsByName.concat(subsByDescription))].slice(0, 5);
      }),
      map((x) => (x && x.length > 0 ? x : null)),
    );

    this.selectValue$
      .pipe(filter((x): x is ["user" | "sub", string] => x !== ""))
      .subscribe(([type, id]) => {
        this.searchValue$.next("");
        switch (type) {
          case "user":
            //TODO: link to chat
            void router.navigate(["/chat", id]);
            break;
          case "sub":
            void router.navigate(["/f", id]);
            break;
        }
      });
  }
}
