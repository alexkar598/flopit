import { Component } from "@angular/core";

import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbSelectModule,
  NbTooltipModule,
  NbUserModule,
} from "@nebular/theme";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";
import { GetImgPipe } from "~/app/pipes/get-img.pipe";
import { AsyncPipe, NgOptimizedImage } from "@angular/common";
import { UserService } from "~/app/services/user.service";

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
    NbSelectModule,
    NbTooltipModule,
    GetImgPipe,
    AsyncPipe,
    NbUserModule,
    NgOptimizedImage,
  ],
  templateUrl: "./parametres.component.html",
  styleUrl: "./parametres.component.scss",
})
export class ParametresComponent {
  selectedItem = "0";

  constructor(public userService: UserService) {}
}
