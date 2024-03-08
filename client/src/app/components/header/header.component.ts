import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbUserModule,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { GetImgPipe } from "~/app/pipes/get-img.pipe";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-header",
  standalone: true,
  imports: [
    CommonModule,
    NbButtonModule,
    NbFormFieldModule,
    NbIconModule,
    NbEvaIconsModule,
    FormsModule,
    NbInputModule,
    NbUserModule,
    GetImgPipe,
    RouterLink,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class HeaderComponent {
  constructor(public userService: UserService) {}
}
