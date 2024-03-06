import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";
import { HeaderComponent } from "./components/header/header.component";
import { CreationCompteComponent } from "./pages/creation-compte/creation-compte.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, NbLayoutModule, NbButtonModule, HeaderComponent, CreationCompteComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
}
