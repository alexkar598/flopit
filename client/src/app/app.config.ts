import {
  ApplicationConfig,
  importProvidersFrom,
  isDevMode,
} from "@angular/core";
import { provideRouter, withRouterConfig } from "@angular/router";
import {
  NbDatepickerModule,
  NbMenuModule,
  NbThemeModule,
  NbToastrModule,
  NbWindowModule,
} from "@nebular/theme";

import { routes } from "./app.routes";
import { provideClientHydration } from "@angular/platform-browser";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { graphqlProvider } from "./graphql.provider";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { QuillConfig, QuillModule } from "ngx-quill";
import { provideServiceWorker } from "@angular/service-worker";

export const quillConfig: QuillConfig = {
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "strike"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["blockquote"],
        ["link", "image"],
        ["clean"],
      ],
    },
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withRouterConfig({ onSameUrlNavigation: "reload" })),
    provideClientHydration(),
    importProvidersFrom(
      NbThemeModule.forRoot(),
      NbToastrModule.forRoot({
        destroyByClick: true,
        preventDuplicates: true,
        duration: 5000,
      }),
      NbMenuModule.forRoot(),
      NbWindowModule.forRoot({
        buttons: { maximize: false, fullScreen: false, minimize: false },
      }),
      NbDatepickerModule.forRoot(),
      QuillModule.forRoot(quillConfig),
      BrowserAnimationsModule,
    ),
    provideHttpClient(withFetch()),
    graphqlProvider,
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode(),
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
};
