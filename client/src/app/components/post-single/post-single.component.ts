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
    let voteDelta = value === VoteValue.Up ? 1 : -1;

    if (value === this.post.currentVote) {
      value = VoteValue.Neutral;
      voteDelta *= -1;
    } else {
      if (this.post.currentVote === VoteValue.Up) voteDelta -= 1;
      if (this.post.currentVote === VoteValue.Down) voteDelta += 1;
    }

    this.voteMut
      .mutate(
        { input: { postId: this.post.id, value } },
        {
          optimisticResponse: {
            __typename: "Mutation",
            votePost: {
              __typename: "TopPost",
              id: this.post.id,
              currentVote: value,
              cachedVotes: this.post.cachedVotes + voteDelta,
            },
          },
        },
      )
      .subscribe();
  }
}
