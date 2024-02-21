import { Component, OnInit } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import {
  NbButtonModule,
  NbInputModule,
  NbSelectWithAutocompleteModule,
} from "@nebular/theme";
import { QuillEditorComponent } from "ngx-quill";
import { gql } from "~/gql/gql";
import { NgForOf } from "@angular/common";
import { Apollo } from "apollo-angular";

const ALL_SUBS_QUERY = gql(/* GraphQL */ `
  query AllSubs {
    subs {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`);

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
  ],
  templateUrl: "./create-post.component.html",
  styleUrl: "./create-post.component.scss",
})
export class CreatePostComponent implements OnInit {
  subs: (
    | { __typename?: "Sub" | undefined; id: string; name: string }
    | undefined
  )[] = [];

  constructor(private apollo: Apollo) {}

  submit(f: NgForm) {
    console.log(f.value);
  }

  ngOnInit() {
    this.apollo
      .watchQuery({ query: ALL_SUBS_QUERY })
      .valueChanges.subscribe(
        ({ data }) =>
          (this.subs = data.subs.edges.map((e) => e?.node).filter(Boolean)),
      );
  }
}
