import { ApplicationConfig, importProvidersFrom } from "@angular/core";
import { provideRouter } from "@angular/router";
import { NbMenuModule, NbThemeModule, NbToastrModule, NbWindowModule } from "@nebular/theme";

import { routes } from "./app.routes";
import { provideClientHydration } from "@angular/platform-browser";
import { provideHttpClient, withFetch } from "@angular/common/http";
import { graphqlProvider } from "./graphql.provider";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { QuillConfig, QuillModule } from "ngx-quill";

const quillConfig: QuillConfig = {
  modules: {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      ["link"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ header: [1, 2, 3, false] }],
      ["clean"],
    ],
  },
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideClientHydration(),
    importProvidersFrom(
      NbThemeModule.forRoot(),
      NbToastrModule.forRoot(),
      NbMenuModule.forRoot(),
      NbWindowModule.forRoot({
        buttons: { maximize: false, fullScreen: false, minimize: false },
      }),
      QuillModule.forRoot(quillConfig),
      BrowserAnimationsModule,
    ),
    provideHttpClient(withFetch()),
    graphqlProvider,
  ],
};
