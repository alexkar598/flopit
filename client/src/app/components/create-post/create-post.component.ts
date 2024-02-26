import { Component } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import {
  NbAutocompleteModule,
  NbButtonModule,
  NbInputModule,
  NbSelectWithAutocompleteModule,
  NbUserModule,
} from "@nebular/theme";
import { QuillEditorComponent } from "ngx-quill";
import { AsyncPipe, NgForOf } from "@angular/common";
import { map } from "rxjs";
import { FindSubsGQL } from "~/graphql";
import { getImgUrl, notNull } from "~/util";

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
  ],
  templateUrl: "./create-post.component.html",
  styleUrl: "./create-post.component.scss",
})
export class CreatePostComponent {
  public subsQuery$;
  public subs$;

  constructor(private findSubsGQL: FindSubsGQL) {
    this.subsQuery$ = findSubsGQL.watch();
    this.subsQuery$.setVariables({ search: "" });
    this.subs$ = this.subsQuery$.valueChanges.pipe(
      map((q) => q.data.subs.edges.map((e) => e?.node).filter(notNull)),
    );
  }

  submit(f: NgForm) {
    console.log(f.value);
  }

  rechercheSub(field: HTMLInputElement) {
    this.subsQuery$.setVariables({ search: field.value });
  }

  onSubSelection($event: any) {
    console.log($event);
  }

  protected readonly getImgUrl = getImgUrl;
}
