import { Component } from "@angular/core";

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule,
} from "@nebular/theme";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";

@Component({
  selector: "app-accueil",
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    TopPostListComponent,
  ],
  templateUrl: "./accueil.component.html",
  styleUrl: "./accueil.component.scss",
})
export class AccueilComponent {}
