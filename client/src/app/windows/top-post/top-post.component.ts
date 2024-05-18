import { AsyncPipe, NgForOf } from "@angular/common";
import { Component, DestroyRef, Input, OnInit } from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import { Router } from "@angular/router";
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbInputModule,
  NbSelectWithAutocompleteModule,
  NbSpinnerModule,
  NbToastrService,
  NbUserModule,
  NbWindowRef,
} from "@nebular/theme";
import { QueryRef } from "apollo-angular";
import { QuillEditorComponent } from "ngx-quill";
import { debounceTime, map, Observable } from "rxjs";
import { isFragment, notNull } from "~/app/util";
import {
  CreatePostGQL,
  EditTopPostGQL,
  EditTopPostInfoFragment,
  EditTopPostInfoGQL,
  FindSubsGQL,
  FindSubsQuery,
  FindSubsQueryVariables,
  FindSubsSubFragment,
  HomeFeedDocument,
  ResolveSubIdGQL,
  SubFeedDocument,
} from "~/graphql";
import { APIError } from "~shared/apierror";

@Component({
  selector: "app-create-post",
  standalone: true,
  imports: [
    FormsModule,
    NbInputModule,
    NbSelectWithAutocompleteModule,
    QuillEditorComponent,
    NbButtonModule,
    NgForOf,
    AsyncPipe,
    NbAutocompleteModule,
    NbUserModule,
    NbSpinnerModule,
    ReactiveFormsModule,
  ],
  templateUrl: "./top-post.component.html",
  styleUrl: "./top-post.component.scss",
})
export class TopPostWindowComponent implements OnInit {
  public subsQuery$!: QueryRef<FindSubsQuery, FindSubsQueryVariables>;
  public subs$!: Observable<FindSubsSubFragment[]>;
  public loading = false;

  @Input()
  public edit?: string;
  protected form = this.formBuilder.nonNullable.group({
    sub_name: { value: "", disabled: false },
    title: "",
    delta_content: { ops: [] },
  });

  constructor(
    private findSubsGQL: FindSubsGQL,
    private resolveSubGQL: ResolveSubIdGQL,
    private createPostMut: CreatePostGQL,
    private editTopPostMut: EditTopPostGQL,
    private editTopPostInfoGQL: EditTopPostInfoGQL,
    private toastr: NbToastrService,
    private windowRef: NbWindowRef,
    private router: Router,
    private formBuilder: FormBuilder,
    private destroyRef: DestroyRef,
  ) {}

  ngOnInit() {
    this.subsQuery$ = this.findSubsGQL.watch({ filter: { name: "" } });
    this.subs$ = this.subsQuery$.valueChanges.pipe(
      map((q) => q.data.subs.edges.map((e) => e?.node).filter(notNull)),
    );
    this.form.valueChanges
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        debounceTime(400),
        map((x) => x.sub_name ?? ""),
      )
      .subscribe(
        (name) => void this.subsQuery$.setVariables({ filter: { name } }),
      );

    if (this.edit != null) {
      this.editTopPostInfoGQL.fetch({ id: this.edit }).subscribe((val) => {
        if (val.errors) return this.windowRef.close();
        if (!isFragment<EditTopPostInfoFragment>("TopPost")(val.data.node))
          return;
        const data = val.data.node;
        this.form.reset({
          title: data.title,
          delta_content: data.deltaContent as any,
        });
      });
    }
  }

  submit() {
    this.loading = true;

    const controls = this.form.controls;
    if (this.edit) {
      this.editTopPostMut
        .mutate({
          input: {
            id: this.edit,
            title: controls.title.dirty ? controls.title.value : undefined,
            delta_content: this.form.controls.delta_content.dirty
              ? { ops: controls.delta_content.value.ops ?? [] }
              : undefined,
          },
        })
        .subscribe(async (res) => {
          this.loading = false;
          if (res.errors) return;
          this.windowRef.close();
        });
      return;
    }

    this.resolveSubGQL
      .fetch({ name: controls.sub_name.value })
      .subscribe((result) => {
        const sub_id = result.data.subByName?.id;
        if (sub_id == null) {
          this.toastr.danger(APIError.SUB_NOT_FOUND, "Erreur");
          this.loading = false;
          return;
        }

        this.createPostMut
          .mutate(
            {
              input: {
                title: controls.title.value,
                sub: sub_id,
                delta_content: {
                  ops: controls.delta_content.value?.ops ?? [],
                },
              },
            },
            {
              refetchQueries: [SubFeedDocument, HomeFeedDocument],
            },
          )
          .subscribe(async (res) => {
            this.loading = false;
            if (res.errors) return;
            await this.router.navigate([
              "f",
              res.data?.createPost?.sub.name,
              res.data?.createPost?.id,
            ]);
            this.windowRef.close();
          });
      });
  }
}
