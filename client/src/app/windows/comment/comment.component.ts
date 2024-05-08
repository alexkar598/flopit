import { AsyncPipe, NgForOf } from "@angular/common";
import { Component, Input, OnInit } from "@angular/core";
import { FormBuilder, FormsModule, ReactiveFormsModule } from "@angular/forms";
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbInputModule,
  NbSelectWithAutocompleteModule,
  NbSpinnerModule,
  NbUserModule,
  NbWindowRef,
} from "@nebular/theme";
import { QuillEditorComponent } from "ngx-quill";
import { isFragment } from "~/app/util";
import {
  BasePostCommentsDocument,
  CreateCommentGQL,
  EditCommentGQL,
  EditCommentInfoFragment,
  EditCommentInfoGQL,
} from "~/graphql";

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
  templateUrl: "./comment.component.html",
  styleUrl: "./comment.component.scss",
})
export class CommentWindowComponent implements OnInit {
  public loading = false;

  @Input()
  public edit?: string;
  @Input()
  public parent?: string;

  protected form = this.formBuilder.nonNullable.group({
    delta_content: { ops: [] },
  });

  constructor(
    private createCommentGQL: CreateCommentGQL,
    private editCommentMut: EditCommentGQL,
    private editCommentInfoGQL: EditCommentInfoGQL,
    private windowRef: NbWindowRef,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit() {
    if (this.edit != null) {
      this.editCommentInfoGQL.fetch({ id: this.edit }).subscribe((val) => {
        if (val.errors) return this.windowRef.close();
        if (!isFragment<EditCommentInfoFragment>("Comment")(val.data.node))
          return;
        const data = val.data.node;
        this.form.reset({
          delta_content: data.deltaContent as any,
        });
      });
    }
  }

  submit() {
    this.loading = true;

    const controls = this.form.controls;
    if (this.edit) {
      this.editCommentMut
        .mutate({
          input: {
            id: this.edit,
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

    this.createCommentGQL
      .mutate(
        {
          input: {
            delta_content: {
              ops: controls.delta_content.value?.ops ?? [],
            },
            parent: this.parent!,
          },
        },
        {
          refetchQueries: [BasePostCommentsDocument],
        },
      )
      .subscribe(async (res) => {
        this.loading = false;
        if (res.errors) return;
        this.windowRef.close();
      });
  }
}
