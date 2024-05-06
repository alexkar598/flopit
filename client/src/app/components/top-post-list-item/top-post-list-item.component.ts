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
  selector: "app-top-post-list-item",
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
  templateUrl: "./top-post-list-item.component.html",
  styleUrl: "./top-post-list-item.component.scss",
})
export class TopPostListItemComponent {
  @Input({ required: true }) post!: TopPostCardFragment;
}
