import { Component, Input } from "@angular/core";
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule,
} from "@nebular/theme";
import { RichTextComponent } from "~/app/components/rich-text/rich-text.component";
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { TopPostCardFragment } from "~/graphql";
import { RouterLink } from "@angular/router";
import { VoteComponent } from "~/app/components/vote/vote.component";

@Component({
  selector: "app-post-single",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    RelativeDatePipe,
    RouterLink,
    VoteComponent,
    RichTextComponent,
  ],
  templateUrl: "./post-single.component.html",
  styleUrl: "./post-single.component.scss",
})
export class PostSingleComponent {
  @Input({ required: true }) post!: TopPostCardFragment;
}
