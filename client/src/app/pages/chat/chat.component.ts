import { Component, OnInit } from "@angular/core";
import { ApolloQueryResult } from "@apollo/client";
import {
  NbCardModule,
  NbChatModule,
  NbListModule,
  NbUserModule,
} from "@nebular/theme";
import { BehaviorSubject, filter, map, Observable } from "rxjs";
import {
  ConversationFragment,
  ListConversationsGQL,
  ListConversationsQuery,
  SendMessageGQL,
  SendMessageMutation,
} from "~/graphql";
import { notNull } from "~/app/util";
import { AsyncPipe } from "@angular/common";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";

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
export class ChatComponent implements OnInit {
  public conversations$!: Observable<ConversationFragment[]>;
  public activeConversation$ = new BehaviorSubject<ConversationFragment | null>(
    null,
  );

  constructor(
    private listConversationsGql: ListConversationsGQL,
    private sendMessageMut: SendMessageGQL,
  ) {}

  ngOnInit(): void {
    this.conversations$ = this.listConversationsGql.watch().valueChanges.pipe(
      map((res) =>
        res.data.currentUser?.conversations.edges
          .map((edge) => edge?.node)
          .filter(notNull),
      ),
      filter(notNull),
    );
  }

  sendMessage(message: string) {
    const target = this.activeConversation$.getValue()?.target.id;
    if (!target) return;

    this.sendMessageMut
      .mutate({ input: { text_content: message, target } })
      .subscribe();
  }
}
