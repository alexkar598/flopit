import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NbButtonModule } from '@nebular/theme';

@Component({
    selector: 'app-header',
    standalone: true,
    imports: [CommonModule, NbButtonModule],
    templateUrl: './header.component.html',
    styleUrl: './header.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent { }
