import { Injectable, OnInit } from "@angular/core";
import {
  CreateUserGQL,
  CreateUserInput,
  CurrentUserGQL,
  CurrentUserQuery,
  LoginGQL,
} from "~/graphql";
import { NbToastrService } from "@nebular/theme";

@Injectable({
  providedIn: "root",
})
export class UserService implements OnInit {
  currentUser?: CurrentUserQuery["currentUser"];

  constructor(
    private loginMut: LoginGQL,
    private createUserMut: CreateUserGQL,
    private currentUserGql: CurrentUserGQL,
    private toastr: NbToastrService,
  ) {}

  ngOnInit(): void {
    this.currentUserGql.watch().valueChanges.subscribe((result) => {
      this.currentUser = result.data.currentUser;
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
          { errorPolicy: "ignore" },
        )
        .subscribe((result) => {
          if (result.data == null) return resolve();
          this.currentUser = result.data.startSession?.user;
          resolve();
        });
    });
  }

  register(input: CreateUserInput): Promise<void> {
    return new Promise((resolve) => {
      this.createUserMut.mutate({ input });
      resolve();
    });
  }
}
