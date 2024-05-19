import { AsyncPipe } from "@angular/common";
import { Component, DestroyRef } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  NbActionsModule,
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
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  of,
  pairwise,
  Subject,
  switchMap,
  tap,
  withLatestFrom,
} from "rxjs";
import { notNull } from "~/app/util";
import {
  GlobalSearchGQL,
  GlobalSearchSubFragment,
  GlobalSearchUserFragment,
} from "~/graphql";
import { UserComponent } from "~/app/components/user/user.component";
import { UserService } from "~/app/services/user.service";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

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
    NbActionsModule,
    UserComponent,
  ],
  templateUrl: "./search.component.html",
  styleUrl: "./search.component.scss",
})
export class SearchComponent {
  protected searchValue$ = new BehaviorSubject<string>("");
  protected selectValue$ = new Subject<
    ["user" | "sub" | "post", string | null] | ""
  >();

  protected resultsLoading$ = new BehaviorSubject(false);
  protected resultsUsers$: Observable<GlobalSearchUserFragment[] | null>;
  protected resultsSubs$: Observable<GlobalSearchSubFragment[] | null>;

  protected isLoggedIn$ = this.userService.currentUser$.pipe(
    takeUntilDestroyed(this.destroyRef),
    map(notNull),
  );

  constructor(
    searchGQL: GlobalSearchGQL,
    router: Router,
    private userService: UserService,
    private destroyRef: DestroyRef,
  ) {
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
    this.resultsUsers$ = combineLatest([results$, this.isLoggedIn$]).pipe(
      map(([results, isLoggedIn]) => (!isLoggedIn ? [] : results?.users.edges)),
      map((x) => x?.map((x) => x?.node).filter(notNull)),
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
        return [...new Set(subsByName.concat(subsByDescription))];
      }),
      map((x) => (x && x.length > 0 ? x : null)),
    );

    this.selectValue$
      .pipe(
        filter(
          (x): x is ["user" | "sub" | "post", string | null] =>
            x != null && x !== "",
        ),
        withLatestFrom(this.searchValue$.pipe(pairwise())),
      )
      .subscribe(([[type, id], [lastSearchValue]]) => {
        this.searchValue$.next("");
        switch (type) {
          case "user":
            if (id == null)
              void router.navigate([
                "/rechercher",
                lastSearchValue,
                "utilisateurs",
              ]);
            else void router.navigate(["/chat", id]);
            break;
          case "sub":
            if (id == null)
              void router.navigate([
                "/rechercher",
                lastSearchValue,
                "communautes",
              ]);
            else void router.navigate(["/f", id]);
            break;
          case "post":
            void router.navigate(["/rechercher", lastSearchValue]);
            break;
        }
      });
  }
}
