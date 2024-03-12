import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
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
import { AsyncPipe, NgForOf } from "@angular/common";
import { map } from "rxjs";
import { CreatePostGQL, FindSubsGQL, SubFeedDocument } from "~/graphql";
import { getImg, notNull } from "~/app/util";
import { Router } from "@angular/router";

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
  ],
  templateUrl: "./create-post.component.html",
  styleUrl: "./create-post.component.scss",
})
export class CreatePostComponent {
  public subsQuery$;
  public subs$;
  public loading = false;

  protected readonly getImg = getImg;

  constructor(
    private findSubsGQL: FindSubsGQL,
    private createPostMut: CreatePostGQL,
    private windowRef: NbWindowRef,
    private router: Router,
  ) {
    this.subsQuery$ = findSubsGQL.watch();
    this.subsQuery$.setVariables({ search: "" });
    this.subs$ = this.subsQuery$.valueChanges.pipe(
      map((q) => q.data.subs.edges.map((e) => e?.node).filter(notNull)),
    );
  }

  submit(f: NgForm) {
    this.loading = true;

    this.createPostMut
      .mutate(
        {
          input: {
            title: f.value.title,
            sub: f.value.sub,
            delta_content: { ops: f.value.content?.ops ?? [] },
          },
        },
        { refetchQueries: [{ query: SubFeedDocument }] },
      )
      .subscribe(async (res) => {
        this.loading = false;
        if (!res.data) return;
        await this.router.navigate(["f", res.data.createPost?.sub.name]);
        this.windowRef.close();
      });
  }

  rechercheSub(field: HTMLInputElement) {
    this.subsQuery$.setVariables({ search: field.value });
  }
}
