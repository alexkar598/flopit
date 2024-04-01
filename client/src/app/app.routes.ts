import { SubComponent } from "./pages/sub/sub.component";
import { AccueilComponent } from "./pages/accueil/accueil.component";

export const routes: Routes = [
  { path: "", component: AccueilComponent },
  { path: "connexion", component: ConnexionComponent },
  { path: "inscription", component: CreationCompteComponent },
  { path: "f/:subName", component: SubComponent },
];
