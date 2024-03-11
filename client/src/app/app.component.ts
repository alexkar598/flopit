import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import {
  NbButtonModule,
  NbIconModule,
  NbLayoutModule,
  NbWindowRef,
  NbWindowService,
} from "@nebular/theme";
import { CreatePostComponent } from "~/app/components/create-post/create-post.component";
import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NbLayoutModule,
    NbButtonModule,
    HeaderComponent,
    FooterComponent,
    NbIconModule
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  constructor(private windowService: NbWindowService) {}

  ecrirePost() {
    this.windowService.open(CreatePostComponent, {
      title: "Nouvelle publication",
      windowClass: "createpost__window",
      closeOnEsc: false,
    });
  }
}
