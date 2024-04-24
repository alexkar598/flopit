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
import { FullTopPostFragment } from "~/graphql";
import { RouterLink } from "@angular/router";
import { VoteComponent } from "~/app/components/vote/vote.component";

@Component({
  selector: "app-top-post",
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
  templateUrl: "./top-post.component.html",
  styleUrl: "./top-post.component.scss",
})
export class TopPostComponent {
  @Input({ required: true }) post!: FullTopPostFragment;
}
