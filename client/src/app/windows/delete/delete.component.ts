import { Component, Input, OnInit } from "@angular/core";
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms";
import {
  NbButtonModule,
  NbDatepickerModule,
  NbInputModule,
  NbSpinnerModule,
  NbToggleModule,
  NbWindowRef,
} from "@nebular/theme";
import { filter, map, Subject, withLatestFrom } from "rxjs";
import { UserService } from "~/app/services/user.service";
import { isFragment } from "~/app/util";
import {
  BanUserGQL,
  DeletePostGQL,
  DeletePostInfoFragment,
  DeletePostInfoGQL,
} from "~/graphql";

@Component({
  standalone: true,
  imports: [
    NbDatepickerModule,
    NbButtonModule,
    NbInputModule,
    ReactiveFormsModule,
    NbSpinnerModule,
    NbToggleModule,
  ],
  templateUrl: "./delete.component.html",
  styleUrl: "./delete.component.scss",
})
export class DeletePostWindowComponent implements OnInit {
  @Input({ required: true })
  public post!: string;

  protected currentDate!: Date;
  protected confirmClick$ = new Subject<void>();

  protected form?: FormGroup<{
    ban: FormControl<boolean>;
    expiry: FormControl<Date>;
    reason: FormControl<string>;
  }>;

  constructor(
    private formBuilder: FormBuilder,
    private deletePostInfoGQL: DeletePostInfoGQL,
    private deletePostGQL: DeletePostGQL,
    private banUserGQL: BanUserGQL,
    private userService: UserService,
    private windowRef: NbWindowRef,
  ) {}

  ngOnInit(): void {
    this.currentDate = new Date();

    this.deletePostInfoGQL
      .fetch({ post: this.post })
      .pipe(
        map((value) => value.data.node),
        filter(isFragment<DeletePostInfoFragment>(["TopPost", "Comment"])),
        withLatestFrom(this.userService.currentUser$),
      )
      .subscribe(([postInfo, currentUser]) => {
        const canBan = Boolean(
          postInfo.sub.isModerator &&
            postInfo.author &&
            postInfo.author.id !== currentUser?.id,
        );

        this.form = this.formBuilder.nonNullable.group({
          ban: { value: canBan, disabled: !canBan },
          expiry: {
            value: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            disabled: !canBan,
          },
          reason: { value: "", disabled: !canBan },
        });

        this.confirmClick$.subscribe(() => {
          const val = this.form!.getRawValue();
          if (val.ban) {
            this.banUserGQL
              .mutate({
                input: {
                  user: postInfo.author!.id,
                  expiry: val.expiry!.toISOString(),
                  sub: postInfo.sub.id,
                  reason: val.reason!,
                },
              })
              .subscribe(({ data }) => {
                if (!data?.addBan) return;
                this.deletePostGQL
                  .mutate({
                    id: this.post,
                  })
                  .subscribe(({ data }) => {
                    if (!data?.deletePost) return;
                    this.windowRef.close();
                  });
              });
          } else {
            this.deletePostGQL
              .mutate({
                id: this.post,
              })
              .subscribe(({ data }) => {
                if (!data?.deletePost) return;
                this.windowRef.close();
              });
          }
        });
      });
  }
}
