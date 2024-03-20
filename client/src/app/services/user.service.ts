import { Injectable } from "@angular/core";
import {
  CreateUserGQL,
  CreateUserInput,
  CurrentUserGQL,
  LoginGQL,
  LogoutGQL,
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
    private logoutMut: LogoutGQL,
    private createUserMut: CreateUserGQL,
    private currentUserGql: CurrentUserGQL,
    private apollo: Apollo,
  ) {
    this.currentUserGql.watch().valueChanges.subscribe((result) => {
      this.currentUserSubject$.next(result.data.currentUser);
    });
  }

  login(email: string, password: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!email || !password)
        return reject("Le courriel et le mots de passe ne peuvent être vide");

      this.loginMut.mutate({ email, password }).subscribe((result) => {
        if (result.errors)
          return reject(result.errors.map((err) => err.message).join("\n"));
        void this.apollo.client.resetStore();
        this.currentUserSubject$.next(result.data!.startSession!.user);
        resolve();
      });
    });
  }

  register(input: CreateUserInput): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!input.email || !input.username || !input.password) {
        return reject("Tous les champs sont obligatoires");
      }

      this.createUserMut.mutate({ input }).subscribe(async (res) => {
        if (res.errors)
          return reject(res.errors.map((err) => err.message).join("\n"));
        await this.login(input.email, input.password);
        return resolve();
      });
    });
  }

  logout(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.logoutMut.mutate({}).subscribe((result) => {
        if (result.errors)
          return reject(result.errors?.map((err) => err.message).join("\n"));
        void this.apollo.client.resetStore();
        resolve();
      });
    });
  }
}
