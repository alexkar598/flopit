import { Component } from "@angular/core";

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbToggleModule,
  NbTooltipModule,
  NbUserModule,
} from "@nebular/theme";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";

@Component({
  selector: "app-parametres",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    TopPostListComponent,
    NbToggleModule,
    NbTooltipModule,
  ],
  templateUrl: "./parametres.component.html",
  styleUrl: "./parametres.component.scss",
})
export class ParametresComponent {}
