import { Routes } from "@angular/router";
import { CreationCompteComponent } from "~/app/pages/creation-compte/creation-compte.component";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { SubComponent } from "./pages/sub/sub.component";
import { AccueilComponent } from "./pages/accueil/accueil.component";
import { ParametresComponent } from "~/app/pages/parametres/parametres.component";

export const routes: Routes = [
  { path: "", component: AccueilComponent },
  { path: "connexion", component: ConnexionComponent },
  { path: "inscription", component: CreationCompteComponent },
  { path: "parametres", component: ParametresComponent },
  { path: "f/:subName", component: SubComponent },
];
