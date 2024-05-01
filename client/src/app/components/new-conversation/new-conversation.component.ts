import { Component, OnInit } from "@angular/core";
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
import { debounceTime, filter, Subject } from "rxjs";
import {
  ListConversationsDocument,
  SendMessageGQL,
  UsernameExistsGQL,
} from "~/graphql";
import { AsyncPipe } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { Router } from "@angular/router";

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
  ],
  templateUrl: "./new-conversation.component.html",
  styleUrl: "./new-conversation.component.scss",
})
export class NewConversationComponent implements OnInit {
  protected userId: string | null = null;
  protected usernameSubject = new Subject<string>();

  constructor(
    private usernameExistsGql: UsernameExistsGQL,
    private sendMessageMut: SendMessageGQL,
    private windowRef: NbWindowRef,
    private router: Router,
  ) {}

  ngOnInit() {
    this.usernameSubject
      .pipe(filter(notNull), debounceTime(400))
      .subscribe((username) =>
        this.usernameExistsGql
          .fetch({ username })
          .subscribe(
            (res) => (this.userId = res.data.userByUsername?.id ?? null),
          ),
      );
  }

  sendMessage(message: string) {
    if (this.userId == null) return;

    this.sendMessageMut
      .mutate(
        {
          input: { text_content: message, target: this.userId },
        },
        {
          refetchQueries: [ListConversationsDocument],
          awaitRefetchQueries: true,
        },
      )
      .pipe(filter((res) => notNull(res.data?.sendMessage)))
      .subscribe(() => {
        void this.router.navigate(["chat", this.userId]);
        this.windowRef.close();
      });
  }
}
