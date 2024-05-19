import { Routes } from "@angular/router";
import { CreationCompteComponent } from "~/app/pages/creation-compte/creation-compte.component";
import { TopPostPageComponent } from "~/app/pages/top-post/top-post.component";
import { ConnexionComponent } from "./pages/connexion/connexion.component";
import { SubComponent } from "./pages/sub/sub.component";
import { AccueilComponent } from "./pages/accueil/accueil.component";
import { ChatComponent } from "~/app/pages/chat/chat.component";
import { ParametresComponent } from "~/app/pages/parametres/parametres.component";
import { CreationSubComponent } from "~/app/pages/creation-sub/creation-sub.component";
import { NotFoundComponent } from "~/app/pages/not-found/not-found.component";
import { authenticatedPageGuard } from "~/app/authenticated-page.guard";
import { SearchPageComponent } from "~/app/pages/search/search.component";

export const routes: Routes = [
  { path: "", component: AccueilComponent, title: "Accueil" },
  { path: "connexion", component: ConnexionComponent, title: "Connexion" },
  {
    path: "inscription",
    component: CreationCompteComponent,
    title: "Inscription",
  },
  { path: "f/:subName", component: SubComponent, title: "f/{2}" },
  {
    path: "f/:subName/:topPostId",
    component: TopPostPageComponent,
  },
  {
    path: "rechercher/:query/:tab",
    component: SearchPageComponent,
    title: "« {2} »",
  },
  {
    path: "rechercher/:query",
    component: SearchPageComponent,
    title: "« {2} »",
  },
  {
    path: "",
    canActivate: [authenticatedPageGuard],
    runGuardsAndResolvers: "always",
    children: [
      {
        path: "f",
        component: CreationSubComponent,
        title: "Créer une communauté",
      },
      {
        path: "parametres",
        component: ParametresComponent,
        title: "Paramètres",
      },
      { path: "chat", component: ChatComponent, title: "Chat" },
      { path: "chat/:user", component: ChatComponent, title: "Chat" },
    ],
  },
  { path: "**", component: NotFoundComponent, title: "Page introuvable" },
];
