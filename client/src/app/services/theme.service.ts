import { Injectable } from "@angular/core";
import { NbThemeService } from "@nebular/theme";
import { BehaviorSubject, distinctUntilChanged, map } from "rxjs";
import { UserService } from "~/app/services/user.service";
import { EditUserGQL, Theme } from "~/graphql";

@Injectable({
  providedIn: "root",
})
export class ThemeService {
  public currentTheme$ = new BehaviorSubject(Theme.Light);

  constructor(
    private editUserMut: EditUserGQL,
    userService: UserService,
    themeService: NbThemeService,
  ) {
    userService.currentUser$
      .pipe(
        map((user) => user?.theme ?? Theme.Light),
        distinctUntilChanged(),
      )
      .subscribe((newTheme) => {
        this.currentTheme$.next(newTheme);

        switch (newTheme) {
          case Theme.Dark:
            themeService.changeTheme("dark");
            break;
          case Theme.Light:
            themeService.changeTheme("default");
            break;
        }
      });
  }

  public changeTheme(newTheme: Theme): Promise<void> {
    return new Promise((resolve, reject) => {
      this.editUserMut
        .mutate({
          input: {
            theme: newTheme,
          },
        })
        .subscribe((result) => {
          if (result.errors)
            return reject(result.errors?.map((err) => err.message).join("\n"));
          resolve();
        });
    });
  }
}
