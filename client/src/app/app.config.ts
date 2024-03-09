import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { NbMenuModule, NbThemeModule, NbToastrModule } from "@nebular/theme";

import { routes } from "./app.routes";
import { provideClientHydration } from "@angular/platform-browser";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { graphqlProvider } from "./graphql.provider";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(
      NbThemeModule.forRoot(),
      NbToastrModule.forRoot(),
      NbMenuModule.forRoot(),
      BrowserAnimationsModule,
    ),
    provideHttpClient(withFetch()),
    graphqlProvider,
  ],
};
