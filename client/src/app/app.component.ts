import {Component} from "@angular/core";
import {CommonModule} from "@angular/common";
import {RouterOutlet} from "@angular/router";
import {NbButtonModule, NbLayoutModule} from "@nebular/theme";
import { CreationCompteComponent } from "./pages/creation-compte/creation-compte.component";

@Component({
    selector: "app-root",
    standalone: true,
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss",
    imports: [CommonModule, RouterOutlet, NbLayoutModule, NbButtonModule, CreationCompteComponent]
})
export class AppComponent {
}
