import { CommonModule } from "@angular/common";
import { Component } from "@angular/core";
import { NbCardModule, NbListModule } from "@nebular/theme";

@Component({
  selector: "app-post-list",
  standalone: true,
  imports: [NbListModule, NbCardModule, CommonModule],
  templateUrl: "./post-list.component.html",
  styleUrl: "./post-list.component.scss",
})
export class PostListComponent {
  articles: any[] = [];

  loadNext() {
    // Use a for loop to generate values up to 20
    for (let i = 1; i <= 20; i++) {
      this.articles.push({
        user: "wdfwf",
        title: `Article ${i}`,
        content: `This is the content of Article ${i}.`,
      });
    }
  }
  /**
    articles = [
      { user: 'wdfwf', title: 'Article 1', content: 'This is the content of Article 1.' },
      { user: 'wdfwf',title: 'Article 2', content: 'This is the content of Article 2.' },
      { user: 'wdfwf',title: 'Article 3', content: 'This is the content of Article 3.' }
      // Add more articles as needed

  ];
  */
}
