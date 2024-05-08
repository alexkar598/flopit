import { Component } from "@angular/core";
import { NbButtonModule, NbCardModule, NbWindowRef } from "@nebular/theme";

@Component({
  selector: "app-yes-no-popup",
  standalone: true,
  imports: [NbCardModule, NbButtonModule],
  templateUrl: "./yes-no-popup.component.html",
  styleUrl: "./yes-no-popup.component.scss",
})
export class YesNoPopupComponent {
  constructor(private ref: NbWindowRef) {}

  no() {
    this.ref.close(false);
  }

  yes() {
    this.ref.close(true);
  }
}
