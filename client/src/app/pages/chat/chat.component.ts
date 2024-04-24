import { Component, DestroyRef, OnInit, ViewChild } from "@angular/core";
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
  BehaviorSubject,
  combineLatest,
  EMPTY,
  filter,
  map,
  Observable,
  sample,
  shareReplay,
  Subject,
  takeUntil,
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
import { notNull } from "~/app/util";
import { AsyncPipe } from "@angular/common";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { Apollo } from "apollo-angular";
import { UserService } from "~/app/services/user.service";
import { ActivatedRoute, Router, RouterLink } from "@angular/router";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { PostSingleComponent } from "~/app/components/post-single/post-single.component";
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
    PostSingleComponent,
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

        if (existingConversation) {
          return existingConversation;
        }

        void this.router.navigate(["chat"]);
        return null;
        //TODO: lol lmao, good luck aurélie
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

    let activeConversationSub = this.activeConversation$
      .pipe(takeUntilDestroyed(this.destroyRef), filter(notNull))
      .subscribe((conversation) => {
        this.loaded = false;

        const cursor = new BehaviorSubject<string | null>(null);
        const hasPreviousPage = new BehaviorSubject(true);

        const messagesQuery = this.listConversationMessagesGql.watch({
          conversation: conversation.id,
          cursor: cursor.getValue(),
        });

        this.fetchMore = async (scroll = true) => {
          if (!hasPreviousPage.getValue()) return;

          if (!scroll) this.autoScroll = false;
          await messagesQuery.fetchMore({
            variables: {
              conversation: conversation.id,
              cursor: cursor.getValue(),
            },
          });
          const scrollable = this.chatContainer?.scrollable
            .nativeElement as HTMLDivElement;
          if (scrollable) {
            const scrollBottom = scrollable.scrollHeight - scrollable.scrollTop;
            setTimeout(() => {
              this.autoScroll = true;
              //Redéfinie car il se peut que angular ait rerender en détruisant les vieux éléments
              const scrollable = this.chatContainer!.scrollable
                .nativeElement as HTMLDivElement;
              scrollable.scrollTop = scrollable.scrollHeight - scrollBottom;
            });
          }
        };

        this.fetchMore(true).then(() => (this.loaded = true));

        this.messages$ = messagesQuery.valueChanges.pipe(
          map((res) => {
            if (res.data.node?.__typename !== "Conversation") return [];

            if (res.data.node.messages.pageInfo.startCursor)
              cursor.next(res.data.node.messages.pageInfo.startCursor);

            hasPreviousPage.next(
              res.data.node.messages.pageInfo.hasPreviousPage,
            );

            if (!this.loaded)
              this.watchMessagesSub
                .subscribe({
                  target: conversation.target.id,
                  after: res.data.node.messages.pageInfo.endCursor,
                })
                .pipe(
                  tap(() => console.log("lmao")),
                  takeUntil(this.activeConversation$),
                  takeUntilDestroyed(this.destroyRef),
                )
                .subscribe((message) => {
                  console.log(message);
                  if (!message.data?.watchMessages) return;

                  this.addClientSideMessage(
                    message.data.watchMessages,
                    conversation.id,
                  );
                });

            return res.data.node.messages.edges
              .map((edge) => edge?.node)
              .filter(notNull);
          }),
        );
      });
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

  newConversation() {
    this.windowService.open(NewConversationComponent, {
      title: "Nouvelle conversation",
    });
  }
}
