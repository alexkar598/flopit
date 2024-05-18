import { Component, DestroyRef, OnInit } from "@angular/core";

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbSelectModule,
  NbToastrService,
  NbTooltipModule,
  NbUserModule,
  NbWindowService,
} from "@nebular/theme";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";
import { AsyncPipe, NgOptimizedImage } from "@angular/common";
import { UserService } from "~/app/services/user.service";
import {
  FormControl,
  FormsModule,
  NonNullableFormBuilder,
  ReactiveFormsModule,
} from "@angular/forms";
import { EditUserGQL } from "~/graphql";
import { Router } from "@angular/router";
import { YesNoPopupComponent } from "~/app/components/yes-no-popup/yes-no-popup.component";
import {
  combineLatest,
  concat,
  distinctUntilChanged,
  filter,
  finalize,
  map,
  Observable,
  of,
  sample,
  Subject,
} from "rxjs";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { notNull } from "~/app/util";
import { FileInputAccessorModule } from "file-input-accessor";

@Component({
  selector: "app-parametres",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    TopPostListComponent,
    NbSelectModule,
    NbTooltipModule,
    AsyncPipe,
    NbUserModule,
    NgOptimizedImage,
    NbInputModule,
    FormsModule,
    NbFormFieldModule,
    ReactiveFormsModule,
    FileInputAccessorModule,
  ],
  templateUrl: "./parametres.component.html",
  styleUrl: "./parametres.component.scss",
})
export class ParametresComponent implements OnInit {
  showPassword = false;
  showConfirmPassword = false;
  deletingAccount = false;
  protected avatarUrl!: Observable<string | null>;
  protected actionSaveChanges$ = new Subject<void>();

  protected form = this.formBuilder.group({
    username: new FormControl(""),
    avatar: new FormControl<File[] | null>(null),
    oldPassword: new FormControl(""),
    newPassword: new FormControl(""),
  });

  constructor(
    public userService: UserService,
    private editUserGql: EditUserGQL,
    private windowService: NbWindowService,
    private router: Router,
    private toastr: NbToastrService,
    private formBuilder: NonNullableFormBuilder,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit(): void {
    this.userService.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(notNull),
        map(({ username }) => username),
        distinctUntilChanged(),
      )
      .subscribe((username) => this.form.controls.username.reset(username));
    this.userService.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        filter(notNull),
        map(({ avatarUrl }) => avatarUrl),
        distinctUntilChanged(),
      )
      .subscribe(() => {
        console.log("Resetting");
        this.form.controls.avatar.reset({ value: null, disabled: false });
      });

    let lastAvatarPreviewUrl: string | null = null;
    this.avatarUrl = combineLatest([
      concat(of(null), this.form.valueChanges).pipe(
        map(() => this.form.getRawValue().avatar),
      ),
      this.userService.currentUser$.pipe(filter(notNull)),
    ]).pipe(
      map(([x, user]) => {
        console.log("new value", x, user);
        const file = x?.[0];
        if (file == null) return user.avatarUrl ?? null;

        if (lastAvatarPreviewUrl != null)
          URL.revokeObjectURL(lastAvatarPreviewUrl);
        return (lastAvatarPreviewUrl = URL.createObjectURL(file));
      }),
      finalize(() => {
        if (lastAvatarPreviewUrl != null)
          URL.revokeObjectURL(lastAvatarPreviewUrl);
      }),
    );

    this.form.valueChanges
      .pipe(sample(this.actionSaveChanges$))
      .subscribe((values) => {
        this.editUserGql
          .mutate({
            input: {
              username: values.username ?? undefined,
              avatar: values.avatar?.[0] ?? undefined,
            },
          })
          .subscribe();
      });
  }

  toggleDeletingAccount() {
    const windowRef = this.windowService.open(YesNoPopupComponent, {
      title: "Suppression du compte",
    });
    windowRef.onClose
      .pipe(filter((res: boolean) => res))
      .subscribe(() => this.deleteAccount());
  }

  deleteAccount() {
    void this.userService.delete();
    this.toastr.success("Le compte a été supprimé avec succès", "Succès");
    void this.router.navigate(["/"]);
  }
}
