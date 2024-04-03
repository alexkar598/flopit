import { Component, OnDestroy, OnInit } from "@angular/core";
import {
  NbCardModule,
  NbChatModule,
  NbListModule,
  NbUserModule,
} from "@nebular/theme";
import {
  BehaviorSubject,
  EMPTY,
  filter,
  map,
  Observable,
  Subscription,
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

@Component({
  selector: "app-chat",
  standalone: true,
  imports: [
    NbListModule,
    NbUserModule,
    AsyncPipe,
    RelativeDatePipe,
    NbCardModule,
    NbChatModule,
  ],
  templateUrl: "./chat.component.html",
  styleUrl: "./chat.component.scss",
})
export class ChatComponent implements OnInit, OnDestroy {
  public conversations$!: Observable<ConversationFragment[]>;
  public activeConversation$ = new BehaviorSubject<ConversationFragment | null>(
    null,
  );
  private activeConversationSub: Subscription | null = null;
  private watchMessagesSubSub: Subscription | null = null;
  public messages$: Observable<MessageFragment[]> = EMPTY;
  public messagesSub: Subscription | null = null;

  constructor(
    private apollo: Apollo,
    private listConversationsGql: ListConversationsGQL,
    private sendMessageMut: SendMessageGQL,
    private watchMessagesSub: WatchMessagesGQL,
    private listConversationMessagesGql: ListConversationMessagesGQL,
  ) {}

  ngOnDestroy(): void {
    this.activeConversationSub?.unsubscribe();
    this.watchMessagesSubSub?.unsubscribe();
  }

  ngOnInit(): void {
    this.conversations$ = this.listConversationsGql.watch().valueChanges.pipe(
      map((res) =>
        res.data.currentUser?.conversations.edges
          .map((edge) => edge?.node)
          .filter(notNull),
      ),
      filter(notNull),
    );

    this.activeConversationSub = this.activeConversation$
      .pipe(filter(notNull))
      .subscribe((conversation) => {
        this.activeConversationSub?.unsubscribe();

        const messagesQuery = this.listConversationMessagesGql.watch({
          conversation: conversation.id,
        }).valueChanges;

        this.messages$ = messagesQuery.pipe(
          map((res) =>
            res.data.node?.__typename === "Conversation"
              ? res.data.node.messages.edges
                  .map((edge) => edge?.node)
                  .filter(notNull)
              : [],
          ),
        );

        this.messagesSub = messagesQuery.subscribe(({ data }) => {
          this.watchMessagesSubSub?.unsubscribe();

          if (!data.node || data.node.__typename !== "Conversation") return;

          this.watchMessagesSubSub = this.watchMessagesSub
            .subscribe(
              {
                target: conversation.target.id,
                after: data.node.messages.pageInfo.endCursor,
              },
              {},
            )
            .subscribe((message) => {
              if (!message.data?.watchMessages) return;

              this.addClientSideMessage(
                message.data.watchMessages,
                conversation.id,
              );
            });
        });
      });
  }

  addClientSideMessage(message: MessageFragment, conversationId: string) {
    const gqlResult = this.apollo.client.readQuery({
      query: ListConversationMessagesDocument,
      variables: {
        conversation: conversationId,
      },
    }) as ListConversationMessagesQuery | null | undefined;

    let messageEdges: unknown[] = [];

    if (gqlResult && gqlResult.node?.__typename === "Conversation")
      messageEdges = gqlResult.node.messages.edges;

    this.apollo.client.writeQuery({
      query: ListConversationMessagesDocument,
      overwrite: false,
      variables: {
        conversation: conversationId,
      },
      data: {
        node: {
          id: conversationId,
          __typename: "Conversation",
          messages: {
            __typename: "MessageConnection",
            pageInfo: {
              endCursor: message.id,
              hasNextPage: false,
            },
            edges: [
              ...messageEdges,
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

  sendMessage(message: string) {
    const conversation = this.activeConversation$.getValue();
    if (!conversation) return;

    const target = conversation?.target.id;

    this.sendMessageMut
      .mutate({ input: { text_content: message, target } })
      .subscribe((res) => {
        if (res.errors || !res.data?.sendMessage) return;

        //this.addClientSideMessage(res.data.sendMessage, conversation.id);
      });
  }
}
