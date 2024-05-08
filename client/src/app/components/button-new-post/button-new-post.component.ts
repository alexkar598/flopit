import { Component } from "@angular/core";
import {
  NbButtonModule,
  NbIconModule,
  NbTooltipModule,
  NbWindowService,
} from "@nebular/theme";
import { TopPostWindowComponent } from "~/app/windows/top-post/top-post.component";
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
  constructor(
    private windowService: NbWindowService,
    public userService: UserService,
  ) {}

  ecrirePost() {
    this.windowService.open(TopPostWindowComponent, {
      title: "Nouvelle publication",
      windowClass: "createpost-window",
      closeOnEsc: false,
    });
  }
}
