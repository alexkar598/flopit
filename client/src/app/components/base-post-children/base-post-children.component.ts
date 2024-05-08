import { AsyncPipe } from "@angular/common";
import {
  Component,
  DestroyRef,
  Input,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormsModule } from "@angular/forms";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbCardModule,
  NbClickableMenuItem,
  NbContextMenuModule,
  NbIconModule,
  NbSpinnerModule,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
  withLatestFrom,
} from "rxjs";
import { RichTextComponent } from "~/app/components/rich-text/rich-text.component";
import { VoteComponent } from "~/app/components/vote/vote.component";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { UserService } from "~/app/services/user.service";
import { isFragment, truthy } from "~/app/util";
import { CommentWindowComponent } from "~/app/windows/comment/comment.component";
import {
  BasePostCommentsGQL,
  CommentListFragment,
  CommentListInfoFragment,
  DeletePostGQL,
} from "~/graphql";

type ChildrenQueryResult = ({
  node:
    | (CommentListInfoFragment & {
        children?: { edges: ChildrenQueryResult };
      })
    | null;
} | null)[];

@Component({
  selector: "app-base-post-children",
  standalone: true,
  imports: [
    NbCardModule,
    FormsModule,
    NbIconModule,
    NbEvaIconsModule,
    NbButtonModule,
    RelativeDatePipe,
    NbUserModule,
    RichTextComponent,
    AsyncPipe,
    NbSpinnerModule,
    VoteComponent,
    NbContextMenuModule,
  ],
  templateUrl: "./base-post-children.component.html",
  styleUrl: "./base-post-children.component.scss",
})
export class BasePostChildrenComponent implements OnChanges {
  @Input({ required: true })
  public parent!: string | ChildrenQueryResult;

  public comments$ = new BehaviorSubject<
    | NonNullable<
        NonNullable<ChildrenQueryResult[0]>["node"] & {
          actions: (NbClickableMenuItem & { icon: string })[];
        }
      >[]
    | null
  >(null);

  private reset$ = new Subject<null>();

  constructor(
    private postCommentsQuery: BasePostCommentsGQL,
    private deletePostGQL: DeletePostGQL,
    private destroyRef: DestroyRef,
    private userService: UserService,
    private windowService: NbWindowService,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    const parentChanges = changes["parent"];
    if (
      parentChanges.isFirstChange() ||
      parentChanges.currentValue !== parentChanges.previousValue
    ) {
      this.reset$.next(null);
      const parent$: Observable<ChildrenQueryResult> =
        typeof this.parent === "string"
          ? this.postCommentsQuery.watch({ id: this.parent }).valueChanges.pipe(
              map((res) => res.data.node),
              filter(isFragment<CommentListFragment>(["TopPost", "Comment"])),
              takeUntil(this.reset$),
              takeUntilDestroyed(this.destroyRef),
              map((node) => node.children.edges),
            )
          : of(this.parent);
      parent$
        .pipe(
          map((res) => res.map((comment) => comment!.node!)),
          withLatestFrom(this.userService.currentUser$),
          map(([res, currentUser]) =>
            res.map((comment) => {
              const isAuthor =
                comment.author?.id && comment.author.id === currentUser?.id;
              const isModerator = comment.sub.isModerator;

              return {
                ...comment,
                actions: [
                  {
                    title: "Répondre",
                    icon: "undo-outline",
                    data: {
                      onClick: () =>
                        this.windowService.open(CommentWindowComponent, {
                          title: "Publier commentaire",
                          windowClass: "createcomment-window",
                          closeOnEsc: false,
                          context: {
                            parent: comment.id,
                          },
                        }),
                    },
                  } satisfies NbClickableMenuItem,
                  isAuthor && {
                    title: "Modifier",
                    icon: "edit-outline",
                    data: {
                      onClick: () =>
                        this.windowService.open(CommentWindowComponent, {
                          title: "Modifier commentaire",
                          windowClass: "editcomment-window",
                          closeOnEsc: false,
                          context: {
                            edit: comment.id,
                          },
                        }),
                    },
                  },
                  (isAuthor || isModerator) && {
                    title: "Supprimer",
                    icon: "trash-2-outline",
                    data: {
                      onClick: () =>
                        this.deletePostGQL
                          .mutate({ id: comment.id })
                          .subscribe(),
                    },
                  },
                ].filter(truthy),
              };
            }),
          ),
        )
        .subscribe((val) => this.comments$.next(val));
    }
  }
}
