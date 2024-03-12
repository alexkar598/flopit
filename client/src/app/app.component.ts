import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { NbButtonModule, NbIconModule, NbLayoutModule } from "@nebular/theme";
import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";
import { ButtonNewPostComponent } from "~/app/components/button-new-post/button-new-post.component";

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
    NbIconModule,
    ButtonNewPostComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {}
