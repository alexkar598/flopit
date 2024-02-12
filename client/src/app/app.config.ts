import {ApplicationConfig, importProvidersFrom} from "@angular/core";
import { NbLayoutFooterComponent } from '@nebular/theme';
import {provideRouter} from "@angular/router";
import {NbThemeModule} from "@nebular/theme";

import {routes} from "./app.routes";
import {provideClientHydration} from "@angular/platform-browser";
import {provideHttpClient, withFetch} from "@angular/common/http";
import {graphqlProvider} from "./graphql.provider";

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(NbThemeModule.forRoot(), NbLayoutFooterComponent),
    provideHttpClient(withFetch()),
    graphqlProvider,
  ],
};
