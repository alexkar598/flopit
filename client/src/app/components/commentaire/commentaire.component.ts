import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NbEvaIconsModule } from '@nebular/eva-icons';
import { NbButtonModule, NbCardModule, NbIconModule } from '@nebular/theme';

@Component({
  selector: 'app-commentaire',
  standalone: true,
  imports: [NbCardModule, FormsModule, NbIconModule, NbEvaIconsModule, NbButtonModule],
  templateUrl: './commentaire.component.html',
  styleUrl: './commentaire.component.scss'
})

export class CommentaireComponent {
}
