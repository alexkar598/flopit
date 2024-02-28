import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";
import { ListeDePublicationsComponent } from "./composants/liste-de-publications/liste-de-publications.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, NbLayoutModule, NbButtonModule, ListeDePublicationsComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
}
