import { Injectable } from "@angular/core";
import {
  CreateUserGQL,
  CreateUserInput,
  CurrentUserGQL,
  CurrentUserQuery,
  LoginGQL,
} from "~/graphql";
import { NbToastrService } from "@nebular/theme";
import { BehaviorSubject } from "rxjs";

@Injectable({
  providedIn: "root",
})
export class UserService {
  private currentUserSubject$ = new BehaviorSubject<
    CurrentUserQuery["currentUser"] | null | undefined
  >(null);
  public currentUser$ = this.currentUserSubject$.asObservable();

  constructor(
    private loginMut: LoginGQL,
    private createUserMut: CreateUserGQL,
    private currentUserGql: CurrentUserGQL,
    private toastr: NbToastrService,
  ) {
    this.currentUserGql
      .watch({}, { fetchPolicy: "no-cache" })
      .valueChanges.subscribe((result) => {
        this.currentUserSubject$.next(result.data.currentUser);
      });
  }

  login(email: string, password: string): Promise<void> {
    return new Promise((resolve) => {
      if (!email || !password) {
        this.toastr.danger(
          "Le courriel et le mots de passe ne peuvent être vide",
          "Erreur",
        );
        return resolve();
      }

      this.loginMut
        .mutate(
          {
            email,
            password,
          },
          { errorPolicy: "ignore", fetchPolicy: "no-cache" },
        )
        .subscribe((result) => {
          if (result.data == null) return resolve();
          this.currentUserSubject$.next(result.data.startSession?.user);
          resolve();
        });
    });
  }
}
