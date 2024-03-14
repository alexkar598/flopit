import { CommonModule } from "@angular/common";
import { ChangeDetectionStrategy, Component, OnInit } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { RouterLink } from "@angular/router";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbContextMenuModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
  NbMenuItem,
  NbMenuService,
  NbToastrService,
  NbUserModule,
} from "@nebular/theme";
import { UserService } from "~/app/services/user.service";
import { GetImgPipe } from "~/app/pipes/get-img.pipe";
import { filter } from "rxjs";

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
    NbContextMenuModule,
  ],
  templateUrl: "./header.component.html",
  styleUrl: "./header.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent implements OnInit {
  constructor(
    public userService: UserService,
    private nbMenuService: NbMenuService,
    public toastr: NbToastrService,
  ) {}

  public userMenuItems: NbMenuItem[] = [
    {
      title: "Déconnexion",
      icon: "log-out",
      data: {
        onClick: (async () => {
          await this.userService.logout();
        }).bind(this),
      },
    },
  ];

  ngOnInit() {
    this.nbMenuService
      .onItemClick()
      .pipe(filter(({ tag }) => tag === "header-user-menu"))
      .subscribe(({ item }) => item.data?.onClick());
  }
}
