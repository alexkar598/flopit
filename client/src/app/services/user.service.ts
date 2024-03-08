import { Injectable } from "@angular/core";
import { CurrentUserGQL, LoginGQL, UserSelfFragment } from "~/graphql";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private currentUserSubject$ = new BehaviorSubject<
    UserSelfFragment | null | undefined
  >(null);
  public currentUser$ = this.currentUserSubject$.asObservable();

  constructor(
    private loginMut: LoginGQL,
    private currentUserGql: CurrentUserGQL,
  ) {
    this.currentUserGql.watch().valueChanges.subscribe((result) => {
      this.currentUserSubject$.next(result.data.currentUser);
    });
  }

  login(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!email || !password)
        return reject("Le courriel et le mots de passe ne peuvent être vide");

      this.loginMut
        .mutate(
          { email, password },
          { errorPolicy: "ignore", fetchPolicy: "no-cache" },
        )
        .subscribe((result) => {
          if (result.data == null)
            return reject(result.errors?.map((err) => err.message).join("\n"));
          this.currentUserSubject$.next(result.data.startSession?.user);
          resolve();
        });
    });
  }
}
