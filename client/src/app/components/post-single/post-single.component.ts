import {Component, Input, OnInit} from '@angular/core';
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule
} from "@nebular/theme";
import {RelativeDatePipe} from "../../pipes/relative-date.pipe";

@Component({
  selector: 'app-post-single',
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule,
    RelativeDatePipe
  ],
  templateUrl: './post-single.component.html',
  styleUrl: './post-single.component.scss'
})
export class PostSingleComponent {

  @Input() post: unknown;

}
