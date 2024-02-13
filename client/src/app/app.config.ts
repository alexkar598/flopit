import {ApplicationConfig, importProvidersFrom} from "@angular/core";
import {provideRouter} from "@angular/router";
import {NbThemeModule, NbToastrModule, NbUserModule} from "@nebular/theme";

import {routes} from "./app.routes";
import {provideClientHydration} from "@angular/platform-browser";
import {provideHttpClient, withFetch} from "@angular/common/http";
import {graphqlProvider} from "./graphql.provider";
import {NbEvaIconsModule} from "@nebular/eva-icons";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(
      BrowserAnimationsModule,
      NbThemeModule.forRoot(),
      NbToastrModule.forRoot(),
      NbEvaIconsModule,
      NbUserModule
    ),
    provideHttpClient(withFetch()),
    graphqlProvider,
  ],
};
