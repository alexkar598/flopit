import { Component, Input } from "@angular/core";
import { PostVoteFragment, VoteGQL, VoteValue } from "~/graphql";
import { NbButtonModule, NbIconModule } from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { firstValueFrom } from "rxjs";

@Component({
  selector: "app-vote",
  standalone: true,
  imports: [NbIconModule, NbButtonModule],
  templateUrl: "./vote.component.html",
  styleUrl: "./vote.component.scss",
})
export class VoteComponent {
  @Input({ required: true }) post!: PostVoteFragment;

  protected readonly VoteValue = VoteValue;

  constructor(
    private voteMut: VoteGQL,
    private userService: UserService,
  ) {}

  public async vote(value: VoteValue) {
    if (value === this.post.currentVote) value = VoteValue.Neutral;

    const voteValueObj = {
      [VoteValue.Up]: 1,
      [VoteValue.Neutral]: 0,
      [VoteValue.Down]: -1,
    };
    const voteDelta =
      voteValueObj[value] -
      voteValueObj[this.post.currentVote ?? VoteValue.Neutral];

    const loggedIn =
      (await firstValueFrom(this.userService.currentUser$)) != null;

    this.voteMut
      .mutate(
        { input: { postId: this.post.id, value } },
        {
          optimisticResponse: {
            __typename: "Mutation",
            votePost: loggedIn
              ? {
                  __typename: this.post.__typename,
                  id: this.post.id,
                  currentVote: value,
                  cachedVotes: this.post.cachedVotes + voteDelta,
                }
              : null,
          },
        },
      )
      .subscribe();
  }
}
