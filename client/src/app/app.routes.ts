import {Routes} from "@angular/router";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { CreationSubComponent } from "./pages/creationSub/creationSub.component";

export const routes: Routes = [
    {path: 'connexion', component: ConnexionComponent},
    {path: 'creation-sub', component: CreationSubComponent}
];
