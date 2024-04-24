import { Routes } from "@angular/router";
import { CreationCompteComponent } from "~/app/pages/creation-compte/creation-compte.component";
import { TopPostPageComponent } from "~/app/pages/top-post/top-post.component";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { SubComponent } from "./pages/sub/sub.component";
import { AccueilComponent } from "./pages/accueil/accueil.component";
import { ChatComponent } from "~/app/pages/chat/chat.component";
import { CreationSubComponent } from "~/app/pages/creation-sub/creation-sub.component";

export const routes: Routes = [
  { path: "", component: AccueilComponent },
  { path: "connexion", component: ConnexionComponent },
  { path: "inscription", component: CreationCompteComponent },
  { path: "f", component: CreationSubComponent },
  { path: "f/:subName", component: SubComponent },
  { path: "f/:subName/:topPostId", component: TopPostPageComponent },
  { path: "chat", component: ChatComponent },
  { path: "chat/:user", component: ChatComponent },
];
