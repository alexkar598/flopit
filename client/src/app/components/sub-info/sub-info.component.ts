import { Component, DestroyRef, Input, OnInit } from "@angular/core";
import {
  BehaviorSubject,
  combineLatest,
  combineLatestWith,
  concat,
  distinctUntilChanged,
  filter,
  finalize,
  firstValueFrom,
  map,
  Observable,
  of,
  sample,
  shareReplay,
  Subject,
  switchMap,
  tap,
} from "rxjs";
import {
  EditSubGQL,
  FollowSubGQL,
  FollowSubMutation,
  SubInformationFragment,
  SubInformationGQL,
  UnfollowSubGQL,
  UnfollowSubMutation,
} from "~/graphql";
import { FormControl, NonNullableFormBuilder } from "@angular/forms";
import { Router, RouterLink } from "@angular/router";
import {
  NbActionsModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbSpinnerModule,
  NbToastrService,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { notNull } from "~/app/util";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ModeratorListWindowComponent } from "~/app/windows/moderator-list/moderator-list.component";
import { AsyncPipe } from "@angular/common";
import { FileInputAccessorModule } from "file-input-accessor";

@Component({
  selector: "app-sub-info",
  standalone: true,
  imports: [
    AsyncPipe,
    NbCardModule,
    FileInputAccessorModule,
    NbIconModule,
    NbButtonModule,
    NbUserModule,
    NbActionsModule,
    NbSpinnerModule,
    RouterLink,
  ],
  templateUrl: "./sub-info.component.html",
  styleUrl: "./sub-info.component.scss",
})
export class SubInfoComponent implements OnInit {
  @Input({ required: true })
  public set subName(value: string) {
    this.subName$.next(value);
  }
  private subName$ = new BehaviorSubject<string | null>(null);

  protected actionToggleFollow$ = new Subject<void>();
  protected actionEditModerators$ = new Subject<void>();
  protected actionSave$ = new Subject<void>();

  public sub$!: Observable<SubInformationFragment | null>;

  protected editing$ = new BehaviorSubject(false);

  protected get editing() {
    return this.editing$.getValue();
  }

  protected form = this.formBuilder.group({
    icon: new FormControl<File[] | null>(null),
    banner: new FormControl<File[] | null>(null),
    description: new FormControl(""),
  });

  protected iconUrl!: Observable<string | null>;
  protected bannerUrl!: Observable<string | null>;

  constructor(
    private router: Router,
    private toastrService: NbToastrService,
    protected windowService: NbWindowService,
    private subInfoQuery: SubInformationGQL,
    private followSubMut: FollowSubGQL,
    private unfollowSubMut: UnfollowSubGQL,
    private editSubMut: EditSubGQL,
    private formBuilder: NonNullableFormBuilder,
    private destroyRef: DestroyRef,
    private userService: UserService,
  ) {}

  ngOnInit(): void {
    this.sub$ = this.subName$.pipe(
      switchMap((subName) =>
        subName == null
          ? of(null)
          : concat(
              of(null),
              this.subInfoQuery
                .watch({
                  sub_name: subName,
                })
                .valueChanges.pipe(
                  map((res) => res.data.subByName ?? null),
                  tap((sub) => {
                    if (sub == null) {
                      this.toastrService.danger(
                        "Cette communauté n'a pas pu être trouvée",
                        "Communauté introuvée!",
                      );
                      void this.router.navigate(["/"]);
                    }
                  }),
                ),
            ),
      ),
      takeUntilDestroyed(this.destroyRef),
      shareReplay(1),
    );

    this.editing$
      .pipe(
        distinctUntilChanged(),
        combineLatestWith(this.sub$),
        map(([, sub]) => sub),
        filter(notNull),
      )
      .subscribe((sub) => {
        this.form.reset({
          banner: null,
          icon: null,
          description: sub.description,
        });
      });

    this.sub$
      .pipe(sample(this.actionToggleFollow$), filter(notNull))
      .subscribe(async (sub) => {
        const optimisticResponse: UnfollowSubMutation | FollowSubMutation = {
          __typename: "Mutation",
          [sub.isFollowing ? "unfollowSub" : "followSub"]:
            (await firstValueFrom(this.userService.currentUser$)) == null
              ? null
              : {
                  __typename: "Sub",
                  id: sub.id,
                  isFollowing: !sub.isFollowing,
                  followers: {
                    __typename: "SubFollowersConnection",
                    totalCount:
                      (sub.followers.totalCount ?? 0) +
                      (sub.isFollowing ? -1 : 1),
                  },
                },
        };

        if (sub.isFollowing)
          this.unfollowSubMut
            .mutate({ input: { subId: sub.id } }, { optimisticResponse })
            .subscribe();
        else
          this.followSubMut
            .mutate({ input: { subId: sub.id } }, { optimisticResponse })
            .subscribe();
      });

    this.sub$
      .pipe(sample(this.actionEditModerators$), filter(notNull))
      .subscribe(({ id }) => {
        this.windowService.open(ModeratorListWindowComponent, {
          title: "Gérer modérateurs",
          windowClass: "moderators-window",
          closeOnEsc: false,
          context: { sub: id },
        });
      });

    combineLatest([this.form.valueChanges, this.sub$])
      .pipe(sample(this.actionSave$))
      .subscribe(([formValues, sub]) => {
        if (sub == null) return;
        this.editSubMut
          .mutate(
            {
              input: {
                id: sub.id,
                banner: this.form.controls.banner.pristine
                  ? undefined
                  : formValues.banner?.[0] ?? undefined,
                icon: this.form.controls.icon.pristine
                  ? undefined
                  : formValues.icon?.[0] ?? undefined,
                description: this.form.controls.description.pristine
                  ? undefined
                  : formValues.description ?? undefined,
              },
            },
            {
              optimisticResponse: {
                editSub: {
                  ...sub,
                  description: formValues.description ?? sub.description,
                },
              },
            },
          )
          .subscribe(async (res) => {
            this.editing$.next(false);
            if (res.errors) return;
          });
      });

    let lastIconPreviewUrl: string | null = null;
    let lastBannerPreviewUrl: string | null = null;
    this.iconUrl = combineLatest([
      concat(of(null), this.form.valueChanges).pipe(
        map(() => this.form.getRawValue().icon),
      ),
      this.sub$.pipe(map((x) => x?.iconUrl)),
    ]).pipe(
      map(([x, currentIconUrl]) => {
        const file = x?.[0];
        if (file == null) return currentIconUrl ?? null;

        if (lastIconPreviewUrl != null) URL.revokeObjectURL(lastIconPreviewUrl);
        return (lastIconPreviewUrl = URL.createObjectURL(file));
      }),
      finalize(() => {
        if (lastIconPreviewUrl != null) URL.revokeObjectURL(lastIconPreviewUrl);
      }),
    );
    this.bannerUrl = combineLatest([
      concat(of(null), this.form.valueChanges).pipe(
        map(() => this.form.getRawValue().banner),
      ),
      this.sub$.pipe(map((x) => x?.bannerUrl)),
    ]).pipe(
      map(([x, currentBannerUrl]) => {
        const file = x?.[0];
        if (file == null) return currentBannerUrl ?? null;

        if (lastBannerPreviewUrl != null)
          URL.revokeObjectURL(lastBannerPreviewUrl);
        return (lastBannerPreviewUrl = URL.createObjectURL(file));
      }),
      finalize(() => {
        if (lastBannerPreviewUrl != null)
          URL.revokeObjectURL(lastBannerPreviewUrl);
      }),
    );
  }
}
