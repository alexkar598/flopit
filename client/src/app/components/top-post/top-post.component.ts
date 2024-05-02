import { AsyncPipe } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbClickableMenuItem,
  NbContextMenuModule,
  NbIconModule,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import { map, Observable, shareReplay } from "rxjs";
import { RichTextComponent } from "~/app/components/rich-text/rich-text.component";
import { UserService } from "~/app/services/user.service";
import { truthy } from "~/app/util";
import { TopPostWindowComponent } from "~/app/windows/top-post/top-post.component";
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { DeletePostGQL, FullTopPostFragment } from "~/graphql";
import { RouterLink } from "@angular/router";
import { VoteComponent } from "~/app/components/vote/vote.component";

@Component({
  selector: "app-top-post",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    RelativeDatePipe,
    RouterLink,
    VoteComponent,
    RichTextComponent,
    AsyncPipe,
    NbContextMenuModule,
  ],
  templateUrl: "./top-post.component.html",
  styleUrl: "./top-post.component.scss",
})
export class TopPostComponent implements OnInit {
  @Input({ required: true }) post!: FullTopPostFragment;

  protected actions$!: Observable<(NbClickableMenuItem & { icon: string })[]>;

  constructor(
    private deletePostGQL: DeletePostGQL,
    private userService: UserService,
    private windowService: NbWindowService,
  ) {}

  ngOnInit(): void {
    this.actions$ = this.userService.currentUser$.pipe(
      map((currentUser) => {
        const isAuthor =
          this.post.author?.id && this.post.author.id === currentUser?.id;
        const isModerator = this.post.sub.isModerator;

        return [
          {
            title: "Répondre",
            icon: "undo-outline",
            data: {
              onClick: () => {
                //TODO responses
              },
            },
          } satisfies NbClickableMenuItem,
          isAuthor && {
            title: "Modifier",
            icon: "edit-outline",
            data: {
              onClick: () => {
                this.windowService.open(TopPostWindowComponent, {
                  title: "Modifier publication",
                  windowClass: "createpost-window",
                  closeOnEsc: false,
                  context: {
                    edit: this.post.id,
                  },
                });
              },
            },
          },
        ].filter(truthy);
      }),
      shareReplay(1),
    );
  }
}
