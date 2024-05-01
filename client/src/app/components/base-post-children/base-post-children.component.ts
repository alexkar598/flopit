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
  NbIconModule,
  NbSpinnerModule,
  NbUserModule,
} from "@nebular/theme";
import {
  BehaviorSubject,
  filter,
  map,
  Observable,
  of,
  Subject,
  takeUntil,
} from "rxjs";
import { RichTextComponent } from "~/app/components/rich-text/rich-text.component";
import { VoteComponent } from "~/app/components/vote/vote.component";
import { RelativeDatePipe } from "~/app/pipes/relative-date.pipe";
import { isFragment } from "~/app/util";
import {
  BasePostCommentsGQL,
  CommentListFragment,
  CommentListInfoFragment,
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
  ],
  templateUrl: "./base-post-children.component.html",
  styleUrl: "./base-post-children.component.scss",
})
export class BasePostChildrenComponent implements OnChanges {
  @Input({ required: true })
  public parent!: string | ChildrenQueryResult;

  public comments$ = new BehaviorSubject<
    NonNullable<NonNullable<ChildrenQueryResult[0]>["node"]>[] | null
  >(null);

  private reset$ = new Subject<null>();

  constructor(
    private postCommentsQuery: BasePostCommentsGQL,
    private destroyRef: DestroyRef,
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
        .pipe(map((res) => res.map((comment) => comment!.node!)))
        .subscribe((val) => this.comments$.next(val));
    }
  }
}
