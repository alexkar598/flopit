import {Routes} from "@angular/router";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { SubComponent } from "./pages/sub/sub.component";

export const routes: Routes = [
    {path: 'connexion', component: ConnexionComponent},
    {path: 'sub', component: SubComponent}
];
