import { Injectable } from "@angular/core";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";
import { Title } from "@angular/platform-browser";

@Injectable()
export class AppCustomTitleStrategy extends TitleStrategy {
  constructor(private readonly title: Title) {
    super();
  }

  override updateTitle(routerState: RouterStateSnapshot) {
    const originalTitle = this.buildTitle(routerState);

    const title = (originalTitle ?? "...").replaceAll(/\{(\d+)}/g, (_, match) =>
      decodeURIComponent(routerState.url.split("/")[parseInt(match)] ?? ""),
    );

    this.setTitleFromString(title);
  }

  setTitleFromString(title: string) {
    this.title.setTitle(title + " - FlopIt");
  }
}
