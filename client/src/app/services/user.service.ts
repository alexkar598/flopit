import { Injectable } from "@angular/core";
import {
  CreateUserGQL,
  CreateUserInput,
  CurrentUserGQL,
  LoginGQL,
  UserSelfFragment,
} from "~/graphql";
import { BehaviorSubject } from "rxjs";
import { WatchQueryFetchPolicy } from "@apollo/client";

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
    private createUserMut: CreateUserGQL,
    private currentUserGql: CurrentUserGQL,
  ) {
    this.refreshCurrentUser();
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

  refreshCurrentUser() {
    this.currentUserGql
      .watch({}, { errorPolicy: "ignore", fetchPolicy: "network-only" })
      .valueChanges.subscribe((result) => {
        this.currentUserSubject$.next(result.data.currentUser);
      });
  }

  async register(
    input: CreateUserInput & { passwordConfirm: string },
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (
        !input.email ||
        !input.username ||
        !input.password ||
        !input.passwordConfirm
      ) {
        return reject("Tous les champs sont obligatoires");
      }

      if (input.password !== input.passwordConfirm) {
        return reject("Les deux mots de passes ne sont pas identiques");
      }

      this.createUserMut
        .mutate(
          {
            input: {
              email: input.email,
              username: input.username,
              password: input.password,
            },
          },
          { errorPolicy: "ignore" },
        )
        .subscribe(async (res) => {
          if (!res.data)
            return reject(res.errors?.map((err) => err.message).join("\n"));
          await this.login(input.email, input.password);
          return resolve();
        });
    });
  }
}
