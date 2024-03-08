import { Component, Input } from "@angular/core";
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule,
} from "@nebular/theme";
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { TopPostCardFragment } from "~/graphql";
import { RouterLink } from "@angular/router";

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
  ],
  templateUrl: "./post-single.component.html",
  styleUrl: "./post-single.component.scss",
})
export class PostSingleComponent {
  @Input({ required: true }) post!: TopPostCardFragment;
}
