import { Component, ElementRef, Input, OnInit, ViewChild } from "@angular/core";
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
import { debounceTime, filter, map, Subject } from "rxjs";
import {
  ListConversationsDocument,
  SendMessageGQL,
  UsernameByIdGQL,
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
  @Input("userId") protected userId: string | null = null;
  protected usernameSubject = new Subject<string>();

  @ViewChild("usernameField") protected usernameField!: ElementRef;

  constructor(
    private usernameExistsGql: UsernameExistsGQL,
    private usernameByIdGql: UsernameByIdGQL,
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

    if (this.userId != null)
      this.usernameByIdGql
        .fetch({ id: this.userId })
        .pipe(
          map((res) =>
            res.data.node?.__typename === "User" ? res.data.node : null,
          ),
          filter(notNull),
        )
        .subscribe(
          ({ username }) => (this.usernameField.nativeElement.value = username),
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
