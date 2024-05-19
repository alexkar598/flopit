import { AsyncPipe, NgIf } from "@angular/common";
import { Component, DestroyRef, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbIconModule,
  NbInputModule,
  NbListModule,
  NbToastrService,
  NbUserModule,
} from "@nebular/theme";
import {
  combineLatest,
  debounceTime,
  filter,
  map,
  Observable,
  sample,
  Subject,
  take,
} from "rxjs";
import { UserService } from "~/app/services/user.service";
import { isFragment, notNull } from "~/app/util";
import {
  CreateModeratorGQL,
  FindUsersFragment,
  FindUsersGQL,
  GetModeratorsFragment,
  GetModeratorsGQL,
  RemoveModeratorGQL,
  ResolveUserIdGQL,
} from "~/graphql";
import { APIError } from "~shared/apierror";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-moderator-list",
  standalone: true,
  imports: [
    NbListModule,
    AsyncPipe,
    NbButtonModule,
    NbIconModule,
    NgIf,
    FormsModule,
    NbAutocompleteModule,
    NbUserModule,
    NbInputModule,
    RouterLink,
  ],
  templateUrl: "./moderator-list.component.html",
  styleUrl: "./moderator-list.component.scss",
})
export class ModeratorListWindowComponent implements OnInit {
  @Input({ required: true })
  public sub!: string;

  protected moderators$!: Observable<{ id: string; username: string }[]>;
  protected actionLoadMore$ = new Subject<void>();
  protected actionRemoveModerator$ = new Subject<string>();

  protected actionCreateNewModerator$ = new Subject<void>();
  public moderatorSuggestions$!: Observable<FindUsersFragment[]>;
  public newModeratorSubject$ = new Subject<string>();

  constructor(
    protected userService: UserService,
    private findUsersGQL: FindUsersGQL,
    private resolveUserGQL: ResolveUserIdGQL,
    private getModeratorsGQL: GetModeratorsGQL,
    private createModeratorGQL: CreateModeratorGQL,
    private removeModeratorGQL: RemoveModeratorGQL,
    private destroyRef: DestroyRef,
    private toastr: NbToastrService,
  ) {}

  ngOnInit(): void {
    const query = this.getModeratorsGQL.watch({ sub: this.sub });
    this.moderators$ = query.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((x) => x.data.node),
      filter(isFragment<GetModeratorsFragment>("Sub")),
      map((x) => x.moderators.edges.map((mod) => mod?.node).filter(notNull)),
      filter(notNull),
    );
    query.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        map((x) => x.data.node),
        filter(isFragment<GetModeratorsFragment>("Sub")),
        map((x) => x.moderators.pageInfo),
        filter(notNull),
        sample(this.actionLoadMore$),
      )
      .subscribe(({ endCursor, hasNextPage }) => {
        if (hasNextPage)
          void query.fetchMore({
            variables: { sub: this.sub, cursor: endCursor },
          });
      });

    this.actionRemoveModerator$.subscribe((user) => {
      this.removeModeratorGQL
        .mutate(
          { user, sub: this.sub },
          { refetchQueries: [this.getModeratorsGQL.document] },
        )
        .subscribe();
    });

    const moderatorSuggestionsQuery = this.findUsersGQL.watch({
      filter: { username: "" },
    });
    this.moderatorSuggestions$ = combineLatest([
      moderatorSuggestionsQuery.valueChanges.pipe(
        takeUntilDestroyed(this.destroyRef),
        map((q) => q.data.users.edges.map((e) => e?.node).filter(notNull)),
        take(50),
      ),
      this.moderators$,
    ]).pipe(
      map(([suggestions, current]) =>
        suggestions.filter(
          ({ username }) => !current.find((x) => x.username === username),
        ),
      ),
    );
    this.newModeratorSubject$
      .pipe(takeUntilDestroyed(this.destroyRef), debounceTime(400))
      .subscribe(
        (username) =>
          void moderatorSuggestionsQuery.setVariables({ filter: { username } }),
      );

    this.newModeratorSubject$
      .pipe(sample(this.actionCreateNewModerator$))
      .subscribe((username) =>
        this.resolveUserGQL.fetch({ username }).subscribe((result) => {
          const user_id = result.data.userByUsername?.id;
          if (user_id == null) {
            this.toastr.danger(APIError.USER_NOT_FOUND, "Erreur");
            return;
          }
          this.createModeratorGQL
            .mutate(
              {
                input: { sub: this.sub, user: user_id },
              },
              { refetchQueries: [this.getModeratorsGQL.document] },
            )
            .subscribe(() => {
              this.newModeratorSubject$.next("");
            });
        }),
      );
  }
}
