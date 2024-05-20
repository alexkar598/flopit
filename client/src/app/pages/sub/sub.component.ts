import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";
import { map, shareReplay } from "rxjs";
import { SubInfoComponent } from "~/app/components/sub-info/sub-info.component";
import { TopPostListComponent } from "~/app/components/top-post-list/top-post-list.component";
import { AsyncPipe } from "@angular/common";

@Component({
  standalone: true,
  imports: [SubInfoComponent, TopPostListComponent, AsyncPipe],
  templateUrl: "./sub.component.html",
  styleUrl: "./sub.component.scss",
})
export class SubComponent {
  protected subName$ = this.route.paramMap.pipe(
    map((x) => x.get("subName")!),
    shareReplay(1),
  );

  constructor(public route: ActivatedRoute) {}
}
