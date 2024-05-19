import { Component, DestroyRef, Input, OnInit } from "@angular/core";
import {
  NbAutocompleteModule,
  NbChatModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSpinnerModule,
  NbUserModule,
  NbWindowRef,
} from "@nebular/theme";
import { notNull } from "~/app/util";
import {
  BehaviorSubject,
  combineLatestWith,
  concat,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  shareReplay,
  Subject,
  switchMap,
  take,
  tap,
} from "rxjs";
import {
  FindUsersFragment,
  FindUsersGQL,
  ListConversationsDocument,
  ResolveUserIdGQL,
  SendMessageGQL,
  UsernameByIdGQL,
} from "~/graphql";
import { AsyncPipe } from "@angular/common";
import { FormControl, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { UserComponent } from "~/app/components/user/user.component";

@Component({
  standalone: true,
  imports: [
    NbChatModule,
    NbInputModule,
    NbAutocompleteModule,
    NbUserModule,
    NbFormFieldModule,
    NbIconModule,
    NbSpinnerModule,
    AsyncPipe,
    FormsModule,
    ReactiveFormsModule,
    UserComponent,
  ],
  templateUrl: "./new-conversation.component.html",
  styleUrl: "./new-conversation.component.scss",
})
export class NewConversationComponent implements OnInit {
  @Input("userId") private userId: string | null = null;
  protected actionSendMessage$ = new Subject<string>();

  constructor(
    private usernameByIdGql: UsernameByIdGQL,
    private resolveUserIdGql: ResolveUserIdGQL,
    private sendMessageMut: SendMessageGQL,
    private windowRef: NbWindowRef,
    private router: Router,
    private findUsersGQL: FindUsersGQL,
    private destroyRef: DestroyRef,
  ) {}

  protected usernameControl = new FormControl("");
  protected resolvedUserId$ = new BehaviorSubject<string | null>(null);
  protected suggestions$!: Observable<FindUsersFragment[]>;

  ngOnInit() {
    if (this.userId != null)
      this.usernameByIdGql
        .fetch({ id: this.userId })
        .pipe(
          map((res) =>
            res.data.node?.__typename === "User" ? res.data.node : null,
          ),
          filter(notNull),
        )
        .subscribe(({ username }) => this.usernameControl.reset(username));

    this.usernameControl.valueChanges
      .pipe(
        distinctUntilChanged(),
        tap(() => this.resolvedUserId$.next(null)),
        filter(notNull),
        debounceTime(100),
        tap(() => this.resolvedUserId$.next(null)),
        switchMap((username) =>
          this.resolveUserIdGql
            .fetch({ username })
            .pipe(map((x) => x.data?.userByUsername?.id ?? null)),
        ),
        shareReplay(1),
      )
      .subscribe(this.resolvedUserId$);

    this.actionSendMessage$
      .pipe(combineLatestWith(this.resolvedUserId$))
      .subscribe(([message, userId]) => {
        if (userId == null) return;

        this.sendMessageMut
          .mutate(
            {
              input: { text_content: message, target: userId },
            },
            {
              refetchQueries: [ListConversationsDocument],
              awaitRefetchQueries: true,
            },
          )
          .pipe(filter((res) => notNull(res.data?.sendMessage)))
          .subscribe(() => {
            void this.router.navigate(["chat", userId]);
            this.windowRef.close();
          });
      });

    const suggestionsQuery = this.findUsersGQL.watch({
      filter: { username: "" },
    });
    this.suggestions$ = suggestionsQuery.valueChanges.pipe(
      takeUntilDestroyed(this.destroyRef),
      map((q) => q.data.users.edges.map((e) => e?.node).filter(notNull)),
      take(50),
    );
    this.usernameControl.valueChanges
      .pipe(distinctUntilChanged(), debounceTime(100))
      .subscribe(
        (username) =>
          void suggestionsQuery.setVariables({ filter: { username } }),
      );
  }
}
