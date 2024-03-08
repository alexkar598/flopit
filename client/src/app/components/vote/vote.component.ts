import { Component, Input } from "@angular/core";
import { TopPostCardFragment, VoteGQL, VoteValue } from "~/graphql";
import { NbButtonModule, NbIconModule } from "@nebular/theme";

@Component({
  selector: "app-vote",
  standalone: true,
  imports: [NbIconModule, NbButtonModule],
  templateUrl: "./vote.component.html",
  styleUrl: "./vote.component.scss",
})
export class VoteComponent {
  @Input({ required: true }) post!: TopPostCardFragment;

  protected readonly VoteValue = VoteValue;

  constructor(private voteMut: VoteGQL) {}

  public vote(value: VoteValue) {
    if (value === this.post.currentVote) value = VoteValue.Neutral;

    const voteValueObj = {
      [VoteValue.Up]: 1,
      [VoteValue.Neutral]: 0,
      [VoteValue.Down]: -1,
    };
    const voteDelta =
      voteValueObj[value] -
      voteValueObj[this.post.currentVote ?? VoteValue.Neutral];

    this.voteMut
      .mutate(
        { input: { postId: this.post.id, value } },
        {
          optimisticResponse: {
            __typename: "Mutation",
            votePost: {
              __typename: this.post.__typename,
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
