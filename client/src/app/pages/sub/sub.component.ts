import { Component, OnDestroy, OnInit } from "@angular/core";
import { Subscription } from "rxjs";
import {
  NbButtonModule,
  NbCardModule,
  NbIconModule,
  NbListModule,
} from "@nebular/theme";
import { Apollo, gql } from "apollo-angular";

const SubInformation = gql(`
    query SubInformation($SubName: String!) {
      subByName(name: $SubName) {
        name
        description
        followers {
          totalCount
        }
      }
    }
  `);

@Component({
  standalone: true,
  imports: [NbCardModule, NbListModule, NbIconModule, NbButtonModule],
  templateUrl: "./sub.component.html",
  styleUrl: "./sub.component.scss",
})
export class SubComponent implements OnInit, OnDestroy {
  private querySubscription!: Subscription;

  constructor(private apollo: Apollo) {}
  ngOnInit() {
    this.querySubscription = this.apollo
      .watchQuery<any>({
        query: SubInformation,
        variables: {
          SubName: "",
        },
      })
      .valueChanges.subscribe(({ data }) => {
        console.log(data);
      });
  }

  ngOnDestroy() {
    this.querySubscription.unsubscribe();
  }
}
