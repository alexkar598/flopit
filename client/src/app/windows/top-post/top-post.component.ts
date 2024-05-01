import { Component, OnDestroy, OnInit } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
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
import { QuillEditorComponent } from "ngx-quill";
import { AsyncPipe, NgForOf } from "@angular/common";
import {
  BehaviorSubject,
  debounceTime,
  map,
  Observable,
  Subscription,
} from "rxjs";
import {
  CreatePostGQL,
  FindSubsGQL,
  FindSubsQuery,
  FindSubsQueryVariables,
  FindSubsSubFragment,
  HomeFeedDocument,
  ResolveSubIdGQL,
  SubFeedDocument,
} from "~/graphql";
import { notNull } from "~/app/util";
import { Router } from "@angular/router";
import { QueryRef } from "apollo-angular";
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
  ],
  templateUrl: "./top-post.component.html",
  styleUrl: "./top-post.component.scss",
})
export class TopPostWindowComponent implements OnInit, OnDestroy {
  public subsQuery$!: QueryRef<FindSubsQuery, FindSubsQueryVariables>;
  public subs$!: Observable<FindSubsSubFragment[]>;
  public loading = false;
  public subFilterSubject = new BehaviorSubject("");
  public subFilterSub!: Subscription;

  constructor(
    private findSubsGQL: FindSubsGQL,
    private resolveSubGQL: ResolveSubIdGQL,
    private createPostMut: CreatePostGQL,
    private toastr: NbToastrService,
    private windowRef: NbWindowRef,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subsQuery$ = this.findSubsGQL.watch({ filter: { name: "" } });
    this.subs$ = this.subsQuery$.valueChanges.pipe(
      map((q) => q.data.subs.edges.map((e) => e?.node).filter(notNull)),
    );
    this.subFilterSub = this.subFilterSubject
      .pipe(debounceTime(400))
      .subscribe(
        (name) => void this.subsQuery$.setVariables({ filter: { name } }),
      );
  }

  ngOnDestroy(): void {
    this.subFilterSub.unsubscribe();
  }

  submit(f: NgForm) {
    this.loading = true;

    this.resolveSubGQL.fetch({ name: f.value.sub }).subscribe((result) => {
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
              title: f.value.title,
              sub: sub_id,
              delta_content: { ops: f.value.content?.ops ?? [] },
            },
          },
          {
            refetchQueries: [SubFeedDocument, HomeFeedDocument],
          },
        )
        .subscribe(async (res) => {
          this.loading = false;
          if (res.errors) return;
          await this.router.navigate(["f", res.data?.createPost?.sub.name]);
          this.windowRef.close();
        });
    });
  }
}
