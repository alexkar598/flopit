import { Component } from "@angular/core";
import { CreatePostComponent } from "~/app/components/create-post/create-post.component";
import {
  NbButtonModule,
  NbIconModule,
  NbTooltipModule,
  NbWindowService,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { AsyncPipe } from "@angular/common";

@Component({
  selector: "app-button-new-post",
  standalone: true,
  imports: [NbIconModule, NbButtonModule, AsyncPipe, NbTooltipModule],
  templateUrl: "./button-new-post.component.html",
  styleUrl: "./button-new-post.component.scss",
})
export class ButtonNewPostComponent {
  protected readonly Boolean = Boolean;

  constructor(
    private windowService: NbWindowService,
    public userService: UserService,
  ) {}

  ecrirePost() {
    this.windowService.open(CreatePostComponent, {
      title: "Nouvelle publication",
      windowClass: "createpost__window",
      closeOnEsc: false,
    });
  }
}
