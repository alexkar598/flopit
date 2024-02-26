import {Routes} from "@angular/router";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { CreationSubComponent } from "./pages/creationSub/creationSub.component";

export const routes: Routes = [
    {path: 'connexion', component: ConnexionComponent},
    {path: 'f', component: CreationSubComponent}
];
