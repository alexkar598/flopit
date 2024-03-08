import { Component, Input } from "@angular/core";
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule,
} from "@nebular/theme";
import { RelativeDatePipe } from "../../pipes/relative-date.pipe";
import { TopPostCardFragment, VoteGQL, VoteValue } from "~/graphql";
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
  protected readonly VoteValue = VoteValue;

  @Input({ required: true }) post!: TopPostCardFragment;

  constructor(private voteMut: VoteGQL) {}

  public vote(value: VoteValue) {
    if (value === this.post.currentVote) value = VoteValue.Neutral;

    this.voteMut
      .mutate(
        { input: { postId: this.post.id, value } },
        {
          optimisticResponse: {
            votePost: {
              currentVote: value,
            },
          },
        },
      )
      .subscribe((res) => {
        if (!res.data) return;
        this.post = {
          ...this.post,
          currentVote: res.data.votePost?.currentVote,
        };
      });
  }
}
