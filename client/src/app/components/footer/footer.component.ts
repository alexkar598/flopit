import { Component } from '@angular/core';
import { NbLayoutModule } from '@nebular/theme';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [NbLayoutModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss'
})
export class FooterComponent {

}
