import { Injectable } from "@angular/core";
import {
  CreateUserGQL,
  CreateUserInput,
  CurrentUserGQL,
  LoginGQL,
  UserSelfFragment,
} from "~/graphql";
import { BehaviorSubject } from "rxjs";
import { Apollo } from "apollo-angular";

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
    private apollo: Apollo,
  ) {
    this.currentUserGql
      .watch({}, { errorPolicy: "ignore" })
      .valueChanges.subscribe((result) => {
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
          void this.apollo.client.resetStore();
          this.currentUserSubject$.next(result.data.startSession?.user);
          resolve();
        });
    });
  }

  async register(input: CreateUserInput): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!input.email || !input.username || !input.password) {
        return reject("Tous les champs sont obligatoires");
      }

      this.createUserMut
        .mutate({ input }, { errorPolicy: "ignore" })
        .subscribe(async (res) => {
          if (!res.data)
            return reject(res.errors?.map((err) => err.message).join("\n"));
          await this.login(input.email, input.password);
          return resolve();
        });
    });
  }
}
