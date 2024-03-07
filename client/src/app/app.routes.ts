import { Routes } from "@angular/router";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { AccueilComponent } from "./pages/accueil/accueil.component";

export const routes: Routes = [
  { path: "connexion", component: ConnexionComponent },
  { path: "accueil", component: AccueilComponent },
];
