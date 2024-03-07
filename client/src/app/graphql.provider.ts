import { Apollo, APOLLO_OPTIONS } from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import {
  ApplicationConfig,
  inject,
  InjectionToken,
  Injector,
  makeStateKey,
  runInInjectionContext,
  TransferState,
} from "@angular/core";
import {
  ApolloClientOptions,
  ApolloLink,
  InMemoryCache,
} from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { NbToastrService } from "@nebular/theme";
import { HttpHeaders } from "@angular/common/http";

const uri = "/graphql";

const APOLLO_CACHE = new InjectionToken<InMemoryCache>("apollo-cache");
const STATE_KEY = makeStateKey<any>("apollo.state");

export function apolloOptionsFactory(
  httpLink: HttpLink,
  cache: InMemoryCache,
  transferState: TransferState,
  toastrService: NbToastrService,
): ApolloClientOptions<any> {
  const isBrowser = transferState.hasKey<any>(STATE_KEY);
  const cookies = inject<string>(<any>"COOKIES", { optional: true });

  if (isBrowser) {
    const state = transferState.get<any>(STATE_KEY, null);
    cache.restore(state);
  } else {
    transferState.onSerialize(STATE_KEY, () => {
      return cache.extract();
    });
    // Reset cache after extraction to avoid sharing between requests
    cache.reset().then();
  }

  const proxyCookiesLink = new ApolloLink((operation, forward) => {
    if (cookies)
      operation.setContext({
        headers: new HttpHeaders().set("Cookie", cookies),
      });

    return forward(operation);
  });

  const errorLink = onError(({ graphQLErrors }) => {
    if (graphQLErrors == null) return;
    graphQLErrors.forEach((err) =>
      toastrService.danger(err.message, "Erreur", {
        destroyByClick: true,
        duration: 1500,
      }),
    );
  });

  const link = proxyCookiesLink.concat(
    errorLink.concat(httpLink.create({ uri })),
  );

  return {
    link,
    cache,
  };
}

export const graphqlProvider: ApplicationConfig["providers"] = [
  Apollo,
  {
    provide: APOLLO_CACHE,
    useValue: new InMemoryCache(),
  },
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
    deps: [HttpLink, APOLLO_CACHE, TransferState, NbToastrService],
  },
];
