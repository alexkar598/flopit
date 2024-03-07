import { Component } from "@angular/core";
import { time } from "console";

@Component({
  selector: "app-accueil",
  standalone: true,
  imports: [],
  templateUrl: "./accueil.component.html",
  styleUrl: "./accueil.component.scss",
})
export class AccueilComponent {
  title: string;
  text: string;
  picture: string;
  commmunity: string;
  timeSince: number;
  news: String;

  constructor() {
    this.title = "get the title from server";
    this.text = "get the text from server";
    this.picture = "get the picture from server";
    this.commmunity = "get the commmunity from server";
    this.timeSince = 0;
    this.news = "get the news from server";
  }
}
