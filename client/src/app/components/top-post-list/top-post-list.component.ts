import { CommonModule } from "@angular/common";
import { Component, EventEmitter, Input, Output } from "@angular/core";
import { NbCardModule, NbListModule } from "@nebular/theme";
import { Observable } from "rxjs";
import { TopPostCardFragment } from "~/graphql";

@Component({
  selector: "app-post-list",
  standalone: true,
  imports: [NbListModule, NbCardModule, CommonModule],
  templateUrl: "./top-post-list.component.html",
  styleUrl: "./top-post-list.component.scss",
})
export class TopPostListComponent {
  @Output()
  loadNext = new EventEmitter<void>();
  @Input({ required: true })
  posts$!: Observable<TopPostCardFragment[]>;
}
