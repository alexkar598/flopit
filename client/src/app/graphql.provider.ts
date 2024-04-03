import {
  getMainDefinition,
  relayStylePagination,
} from "@apollo/client/utilities";
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
  from,
  InMemoryCache,
  split,
} from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { NbToastrService } from "@nebular/theme";
import { HttpHeaders } from "@angular/common/http";
import { StrictTypedTypePolicies } from "~/graphql";
import { ErrorCode } from "~shared/apierror";
import { Router } from "@angular/router";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const uri = "/graphql";

const APOLLO_CACHE = new InjectionToken<InMemoryCache>("apollo-cache");
const STATE_KEY = makeStateKey<any>("apollo.state");

export function apolloOptionsFactory(
  httpLink: HttpLink,
  cache: InMemoryCache,
  transferState: TransferState,
  toastrService: NbToastrService,
  router: Router,
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
    graphQLErrors.forEach((err) => {
      const code = <ErrorCode>err.extensions?.["code"];

      if (code === "AUTHENTICATED_FIELD") return;

      if (code === "AUTHENTICATED_MUTATION") {
        const toast = toastrService.info(
          "Connectez-vous ou créez-vous un compte pour intéragir sur FlopIt",
          "Inscrivez-vous!",
          { icon: "log-in", duration: 2500 },
        );
        toast.onClick().subscribe(() => router.navigate(["inscription"]));
        return;
      }

      toastrService.danger(err.message, "Erreur");
    });
  });

  const http = httpLink.create({ uri });

  let ws: GraphQLWsLink | undefined;
  if (isBrowser) ws = new GraphQLWsLink(createClient({ url: uri }));

  const link = from([
    proxyCookiesLink,
    errorLink,
    split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return !(
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      http,
      ws,
    ),
  ]);

  return {
    link,
    cache,
    defaultOptions: {
      watchQuery: {
        errorPolicy: "ignore",
      },
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
            homefeed: relayStylePagination(["sortOptions", "ignoreFollows"]),
          },
        },
        Sub: {
          fields: {
            posts: relayStylePagination(["sortOptions"]),
          },
        },
      } satisfies StrictTypedTypePolicies,
    }),
  },
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
    deps: [HttpLink, APOLLO_CACHE, TransferState, NbToastrService, Router],
  },
];
