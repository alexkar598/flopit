import { Component } from "@angular/core";
import { NbCardModule } from "@nebular/theme";

@Component({
  selector: "app-yes-no-popup",
  standalone: true,
  imports: [NbCardModule],
  templateUrl: "./yes-no-popup.component.html",
  styleUrl: "./yes-no-popup.component.scss",
})
export class YesNoPopupComponent {}
