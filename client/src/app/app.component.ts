import { Component, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { RouterOutlet } from "@angular/router";
import { NbButtonModule, NbLayoutModule, NbMenuService } from "@nebular/theme";
import { FooterComponent } from "./components/footer/footer.component";
import { HeaderComponent } from "./components/header/header.component";

@Component({
  selector: "app-root",
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    NbLayoutModule,
    NbButtonModule,
    HeaderComponent,
    FooterComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent implements OnInit {
  constructor(private nbMenuService: NbMenuService) {}

  ngOnInit(): void {
    this.nbMenuService
      .onItemClick()
      .subscribe(({ item }) => item.data?.onClick());
  }
}
