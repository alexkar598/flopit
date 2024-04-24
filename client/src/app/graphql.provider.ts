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
  FieldMergeFunction,
  from,
  InMemoryCache,
  split,
} from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { NbToastrService } from "@nebular/theme";
import { HttpHeaders } from "@angular/common/http";
import { Maybe, Node, StrictTypedTypePolicies } from "~/graphql";
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

      if (code === "VALIDATION_ERROR") {
        (err.extensions["issues"] as { message: string }[]).forEach(
          ({ message }) => toastrService.danger(message, err.message),
        );
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

type CachedMessageEdge = { node: { __ref: string } };
const messageFieldPolicyPagination = relayStylePagination(["target"]);

export const graphqlProvider: ApplicationConfig["providers"] = [
  Apollo,
  {
    provide: APOLLO_CACHE,
    useValue: new InMemoryCache({
      possibleTypes: {
        BasePost: ["Comment", "TopPost"],
      },
      typePolicies: {
        Query: {
          fields: {
            homefeed: relayStylePagination(["sortOptions", "ignoreFollows"]),
          },
        },
        Conversation: {
          fields: {
            messages: {
              ...messageFieldPolicyPagination,
              merge(
                existing: { edges: Maybe<{ node: Node }>[] },
                incoming: { edges: Maybe<{ node: Node }>[] },
                args,
              ) {
                const merged = (
                  messageFieldPolicyPagination.merge as FieldMergeFunction
                )(existing, incoming, args);

                const firstIncomingId = incoming?.edges[0]?.node.id as
                  | string
                  | undefined;
                //Aucun incoming, null op
                if (firstIncomingId === undefined) return merged;

                let existingLastIndex = existing?.edges.findIndex(
                  (x) => x && x.node.id > firstIncomingId,
                );
                //Aucun incoming, défaut
                if (existingLastIndex === undefined) return merged;

                if (existingLastIndex === -1) existingLastIndex = 0;

                return {
                  pageInfo: merged.pageInfo,
                  edges: [
                    ...existing.edges.splice(0, existingLastIndex - 1),
                    ...incoming.edges,
                    ...existing.edges.splice(existingLastIndex),
                  ],
                };
              },
            },
          },
        },
        Sub: {
          fields: {
            posts: relayStylePagination(["sortOptions"]),
          },
        },
        TopPost: {
          fields: {
            children: relayStylePagination(["sortOptions"]),
          },
        },
        Comment: {
          fields: {
            children: relayStylePagination(["sortOptions"]),
          },
        },
        BasePost: {
          fields: {
            children: relayStylePagination(["sortOptions"]),
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
