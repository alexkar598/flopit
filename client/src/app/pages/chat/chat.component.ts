import {
  Component,
  DestroyRef,
  Inject,
  OnInit,
  PLATFORM_ID,
  ViewChild,
} from "@angular/core";
import {
  NbCardModule,
  NbChatComponent,
  NbChatModule,
  NbIconModule,
  NbListModule,
  NbSpinnerModule,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import {
  combineLatest,
  EMPTY,
  filter,
  firstValueFrom,
  map,
  Observable,
  sample,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  ConversationFragment,
  ListConversationMessagesDocument,
  ListConversationMessagesGQL,
  ListConversationMessagesQuery,
  ListConversationsGQL,
  MessageFragment,
  SendMessageGQL,
  WatchMessagesGQL,
} from "~/graphql";
import { notNull, throwException } from "~/app/util";
import { AsyncPipe, isPlatformBrowser } from "@angular/common";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { Apollo } from "apollo-angular";
import { UserService } from "~/app/services/user.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { IntersectionObserverDirective } from "~/app/directives/intersection-observer.directive";
import { NewConversationComponent } from "~/app/components/new-conversation/new-conversation.component";

@Component({
  standalone: true,
  imports: [
    NbListModule,
    NbUserModule,
    AsyncPipe,
    RelativeDatePipe,
    NbCardModule,
    NbChatModule,
    NbSpinnerModule,
    IntersectionObserverDirective,
    RouterLink,
    NbIconModule,
  ],
  templateUrl: "./chat.component.html",
  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit {
  public actionSendMessage$ = new Subject<string>();
  public conversations$!: Observable<ConversationFragment[]>;
  public activeConversation$!: Observable<ConversationFragment | null>;
  public messages$: Observable<MessageFragment[]> = EMPTY;
  public fetchMore: ((scroll?: boolean) => Promise<unknown>) | null = null;

  public loaded = false;
  public autoScroll = true;

  @ViewChild("container")
  public chatContainer?: NbChatComponent;

  constructor(
    private apollo: Apollo,
    private listConversationsGql: ListConversationsGQL,
    private sendMessageMut: SendMessageGQL,
    private watchMessagesSub: WatchMessagesGQL,
    private listConversationMessagesGql: ListConversationMessagesGQL,
    private userService: UserService,
    private router: Router,
    private destroyRef: DestroyRef,
    private route: ActivatedRoute,
    private windowService: NbWindowService,
    @Inject(PLATFORM_ID) private platformId: string,
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter((user) => user == null),
      )
      .subscribe(() => this.router.navigate(["connexion"]));

    this.conversations$ = this.listConversationsGql.watch().valueChanges.pipe(
      map((res) =>
        res.data.currentUser?.conversations.edges
          .map((edge) => edge?.node)
          .filter(notNull),
      ),
      filter(notNull),
      map((list) =>
        list.sort(
          (a, b) =>
            new Date(b.lastInteraction).getTime() -
            new Date(a.lastInteraction).getTime(),
        ),
      ),
    );

    this.activeConversation$ = combineLatest([
      this.conversations$,
      this.route.paramMap.pipe(map((x) => x.get("user"))),
    ]).pipe(
      map(([conversations, user]) => {
        if (user == null) return null;

        const existingConversation = conversations.find(
          (x) => x.target.id === user,
        );

        if (existingConversation) return existingConversation;

        if (isPlatformBrowser(this.platformId))
          this.newConversationWindow(user);
        return null;
      }),
      shareReplay(1),
    );

    combineLatest([this.actionSendMessage$, this.activeConversation$])
      .pipe(
        sample(this.actionSendMessage$),
        takeUntilDestroyed(this.destroyRef),
        map(([a, b]) => (b == null ? null : ([a, b] as const))),
        filter(notNull),
      )
      .subscribe(([message, conversation]) => {
        this.sendMessageMut
          .mutate({
            input: { text_content: message, target: conversation.target.id },
          })
          .subscribe();
      });

    let cursor: string | null = null;
    let hasPreviousPage = true;

    const listMessageQuery = this.activeConversation$.pipe(
      takeUntilDestroyed(this.destroyRef),
      filter(notNull),
      tap(() => {
        this.loaded = false;
        cursor = null;
        hasPreviousPage = true;
      }),
      switchMap((conversation) => {
        const messagesQuery = this.listConversationMessagesGql.watch({
          conversation: conversation.id,
          cursor: cursor,
        });

        this.fetchMore = async (scroll = true) => {
          if (!hasPreviousPage) return;

          if (!scroll) this.autoScroll = false;
          await messagesQuery.fetchMore({
            variables: {
              conversation: conversation.id,
              cursor: cursor,
            },
          });
          const scrollable = this.chatContainer?.scrollable
            .nativeElement as HTMLDivElement;
          if (scrollable) {
            const scrollBottom = scrollable.scrollHeight - scrollable.scrollTop;
            setTimeout(() => {
              this.autoScroll = true;
              //Redéfinie, car il se peut qu'Angular ait rerender en détruisant les vieux éléments
              const scrollable = this.chatContainer!.scrollable
                .nativeElement as HTMLDivElement;
              scrollable.scrollTop = scrollable.scrollHeight - scrollBottom;
            });
          }
        };

        return messagesQuery.valueChanges;
      }),
      map((res) =>
        res.data.node?.__typename === "Conversation" ? res.data.node : null,
      ),
      filter(notNull),
    );

    this.messages$ = listMessageQuery.pipe(
      tap(() => this.fetchMore!(true).then(() => (this.loaded = true))),
      map((conversation) =>
        conversation.messages.edges.map((edge) => edge?.node).filter(notNull),
      ),
    );

    listMessageQuery
      .pipe(
        tap((conversation) => {
          cursor = conversation.messages.pageInfo.startCursor ?? null;
          hasPreviousPage = conversation.messages.pageInfo.hasPreviousPage;
        }),
        switchMap((conversation) =>
          this.watchMessagesSub.subscribe({
            target: conversation.target.id,
            after: conversation.messages.pageInfo.endCursor,
          }),
        ),
        map((message) => message.data?.watchMessages),
        filter(notNull),
        tap(async (message) =>
          this.addClientSideMessage(
            message,
            (await firstValueFrom(this.activeConversation$))?.id ??
              throwException(
                "Il n'y a pas de conversation à laquelle ajouter le message",
              ),
          ),
        ),
      )
      .subscribe();
  }

  addClientSideMessage(message: MessageFragment, conversationId: string) {
    const gqlResult = this.apollo.client.readQuery({
      query: ListConversationMessagesDocument,
      variables: {
        conversation: conversationId,
      },
    }) as ListConversationMessagesQuery | null | undefined;

    if (!gqlResult || gqlResult.node?.__typename !== "Conversation") return;

    this.apollo.client.writeQuery({
      query: ListConversationMessagesDocument,
      variables: {
        conversation: conversationId,
      },
      data: {
        node: {
          id: conversationId,
          __typename: "Conversation",
          lastInteraction: new Date().toISOString(),
          target: gqlResult.node.target,
          messages: {
            __typename: "MessageConnection",
            pageInfo: {
              ...gqlResult.node.messages.pageInfo,
              endCursor: message.id,
            },
            edges: [
              ...gqlResult.node.messages.edges,
              {
                __typename: "MessageEdge",
                node: message,
              },
            ],
          },
        },
      },
    });
  }

  isEmojiOnly(message: string): boolean {
    const regex = String.raw`^[\s\p{Extended_Pictographic}]+$`;
    return new RegExp(regex, "u").test(message);
  }

  newConversationWindow(userId?: string) {
    this.windowService.open(NewConversationComponent, {
      title: "Nouvelle conversation",
      context: { userId },
    });
  }
}
