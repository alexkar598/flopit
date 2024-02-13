import {Component} from '@angular/core';
import {
  NbButtonGroupModule,
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbUserModule
} from "@nebular/theme";

@Component({
  selector: 'app-post-single',
  standalone: true,
  imports: [
    NbCardModule,
    NbIconModule,
    NbButtonGroupModule,
    NbButtonModule,
    NbUserModule
  ],
  templateUrl: './post-single.component.html',
  styleUrl: './post-single.component.scss'
})
export class PostSingleComponent {
}
