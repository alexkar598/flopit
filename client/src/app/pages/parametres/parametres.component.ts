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
import { ChangePasswordGQL, EditUserGQL } from "~/graphql";
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
  showOldPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  deletingAccount = false;
  protected avatarUrl!: Observable<string | null>;
  protected actionSaveChanges$ = new Subject<void>();

  protected form = this.formBuilder.group({
    username: new FormControl(""),
    avatar: new FormControl<File[] | null>(null),
    oldPassword: new FormControl(""),
    newPassword: new FormControl(""),
    confirmPassword: new FormControl(""),
  });

  constructor(
    public userService: UserService,
    private editUserGql: EditUserGQL,
    private changePasswordGql: ChangePasswordGQL,
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
        this.form.controls.avatar.reset({ value: null, disabled: false });
      });

    let lastAvatarPreviewUrl: string | null = null;
    this.avatarUrl = combineLatest([
      concat(of(null), this.form.valueChanges).pipe(
        map(() => this.form.getRawValue().avatar),
        distinctUntilChanged(),
      ),
      this.userService.currentUser$.pipe(
        filter(notNull),
        map((x) => x.avatarUrl),
      ),
    ]).pipe(
      map(([x, currentAvatarUrl]) => {
        const file = x?.[0];
        if (file == null) return currentAvatarUrl ?? null;

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
        if (
          this.form.controls.username.dirty ||
          this.form.controls.avatar.dirty
        )
          this.editUserGql
            .mutate({
              input: {
                username: this.form.controls.username.pristine
                  ? undefined
                  : values.username ?? undefined,
                avatar: this.form.controls.avatar.pristine
                  ? undefined
                  : values.avatar?.[0] ?? undefined,
              },
            })
            .subscribe((res) => {
              if (res.errors == null)
                this.toastr.success(
                  "Informations enregistrés avec succès",
                  "Succès!",
                );
            });

        if (
          values.newPassword &&
          values.confirmPassword &&
          values.oldPassword
        ) {
          if (values.newPassword != values.confirmPassword) {
            this.toastr.danger(
              "Les mot de passes ne sont pas identiques",
              "Erreur",
            );
            return;
          }

          this.changePasswordGql
            .mutate({
              input: {
                old: values.oldPassword,
                new: values.newPassword,
              },
            })
            .subscribe((result) => {
              if (result.errors) return;

              this.form.controls.oldPassword.reset("");
              this.form.controls.newPassword.reset("");
              this.form.controls.confirmPassword.reset("");

              this.toastr.success(
                "Mot de passe changé avec succès!",
                "Succès!",
              );
            });
        }
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
