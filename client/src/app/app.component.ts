import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";
import { AccueilComponent } from "./components/accueil/accueil.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, NbLayoutModule, NbButtonModule, AccueilComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
}
