import { relayStylePagination } from "@apollo/client/utilities";
import { Apollo, APOLLO_OPTIONS } from "apollo-angular";
import { HttpLink } from "apollo-angular/http";
import {
  ApplicationConfig,
  inject,
  InjectionToken,
  makeStateKey,
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
import { StrictTypedTypePolicies } from "~/graphql";

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
    void cache.reset();
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
    graphQLErrors
      .filter((err) => err.extensions?.["code"] !== "AUTHENTICATED_FIELD")
      .forEach((err) =>
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
    defaultOptions: {
      query: {
        errorPolicy: "ignore",
      },
      mutate: {
        errorPolicy: "all",
      },
    },
  };
}

export const graphqlProvider: ApplicationConfig["providers"] = [
  Apollo,
  {
    provide: APOLLO_CACHE,
    useValue: new InMemoryCache({
      typePolicies: {
        Query: {
          fields: {
            homefeed: relayStylePagination(),
          },
        },
      } satisfies StrictTypedTypePolicies,
    }),
  },
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
    deps: [HttpLink, APOLLO_CACHE, TransferState, NbToastrService],
  },
];
