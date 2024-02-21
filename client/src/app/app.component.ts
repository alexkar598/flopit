import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";
import { CommentaireComponent } from "./components/commentaire/commentaire.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, NbLayoutModule, NbButtonModule, CommentaireComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
}
