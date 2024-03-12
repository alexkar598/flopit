import { Component } from "@angular/core";
import { CreatePostComponent } from "~/app/components/create-post/create-post.component";
import { NbButtonModule, NbIconModule, NbWindowService } from "@nebular/theme";

@Component({
  selector: "app-button-new-post",
  standalone: true,
  imports: [NbIconModule, NbButtonModule],
  templateUrl: "./button-new-post.component.html",
  styleUrl: "./button-new-post.component.scss",
})
export class ButtonNewPostComponent {
  constructor(private windowService: NbWindowService) {}

  ecrirePost() {
    this.windowService.open(CreatePostComponent, {
      title: "Nouvelle publication",
      windowClass: "createpost__window",
      closeOnEsc: false,
    });
  }
}
