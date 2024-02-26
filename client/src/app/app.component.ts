import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, RouterOutlet, NbLayoutModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
}
