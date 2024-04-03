import { AsyncPipe } from "@angular/common";
import { Component } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { NbSpinnerModule, NbToastrService } from "@nebular/theme";
import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  mergeMap,
  switchMap,
  tap,
} from "rxjs";
import { PostSingleComponent } from "~/app/components/post-single/post-single.component";
import { isFragment } from "~/app/util";
import { PostByIdGQL, TopPostCardFragment } from "~/graphql";

@Component({
  standalone: true,
  imports: [AsyncPipe, PostSingleComponent, NbSpinnerModule, RouterLink],
  templateUrl: "./top-post.component.html",
  styleUrl: "./top-post.component.scss",
})
export class TopPostComponent {
  public post$ = new BehaviorSubject<TopPostCardFragment | null>(null);

  constructor(
    postByIdQuery: PostByIdGQL,
    toastrService: NbToastrService,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    route.paramMap
      .pipe(
        map((x) => x.get("topPostId")!),
        distinctUntilChanged(),
        tap(() => this.post$.next(null)),
        switchMap(
          (id) =>
            postByIdQuery.watch({
              id,
            }).valueChanges,
        ),
        map((res) => res.data.node!),
        tap((post) => {
          if (post == null) {
            toastrService.danger(
              "Cette publication n'a pas pu être trouvée",
              "Publication introuvée!",
            );
            this.navigateToSub();
          }
        }),
        filter(isFragment<TopPostCardFragment>("TopPost")),
        takeUntilDestroyed(),
      )
      .subscribe(this.post$);

    combineLatest([
      route.paramMap.pipe(
        map((x) => x.get("subName")!),
        distinctUntilChanged(),
      ),
      this.post$,
    ])
      .pipe(mergeMap(([a, b]) => (b == null ? [] : [[a, b.sub.name]])))
      .subscribe(([paramSub, realSub]) => {
        if (paramSub === realSub) return;

        void this.router.navigate([
          "/f",
          realSub,
          this.route.snapshot.paramMap.get("topPostId"),
        ]);
      });
  }

  public navigateToSub() {
    const subName =
      this.post$.getValue()?.sub.name ??
      this.route.snapshot.paramMap.get("subName");
    if (subName) void this.router.navigate(["/f", subName]);
    else void this.router.navigate(["/"]);
  }
}
