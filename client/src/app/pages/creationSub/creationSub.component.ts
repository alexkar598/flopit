import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import {NbButtonModule, NbCardModule, NbFormFieldModule, NbIconModule, NbInputModule} from "@nebular/theme";

@Component({
  standalone: true,
  imports: [NbButtonModule, NbCardModule, NbInputModule, NbFormFieldModule, NbIconModule, NbEvaIconsModule, FormsModule],
  templateUrl: './creationSub.component.html',
  styleUrl: './creationSub.component.scss'
})

export class CreationSubComponent {
}
