import { Component } from "@angular/core";
import { NbCardModule } from "@nebular/theme";

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [NbCardModule],
  templateUrl: "./not-found.component.html",
  styleUrl: "./not-found.component.scss",
})
export class NotFoundComponent {}
