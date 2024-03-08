import { Routes } from "@angular/router";
import { CreationCompteComponent } from "~/app/pages/creation-compte/creation-compte.component";
import { ConnexionComponent } from "./pages/connexion/connexion.component";

export const routes: Routes = [
  { path: "connexion", component: ConnexionComponent },
  { path: "inscription", component: CreationCompteComponent },
];
