import { Component, ElementRef, ViewChild } from "@angular/core";
import { FormsModule, NgForm } from "@angular/forms";
import { NbEvaIconsModule } from "@nebular/eva-icons";
import {
  NbButtonModule,
  NbCardModule,
  NbFormFieldModule,
  NbIconModule,
  NbInputModule,
} from "@nebular/theme";

@Component({
  standalone: true,
  imports: [
    NbButtonModule,
    NbCardModule,
    NbInputModule,
    NbFormFieldModule,
    NbIconModule,
    NbEvaIconsModule,
    FormsModule,
  ],
  templateUrl: "./creation-sub.component.html",
  styleUrl: "./creation-sub.component.scss",
})
export class CreationSubComponent {
  submit(f: NgForm) {
    console.log(f.value);
  }
}
