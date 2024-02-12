import {
  mergeApplicationConfig,
  ApplicationConfig,
  importProvidersFrom,
} from "@angular/core";
import {provideServerRendering} from "@angular/platform-server";
import {NbThemeModule} from "@nebular/theme";
import {appConfig} from "./app.config";

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    importProvidersFrom(NbThemeModule.forRoot()),
  ],
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
