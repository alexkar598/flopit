import {
  getMainDefinition,
  relayStylePagination,
} from "@apollo/client/utilities";
import { Apollo, APOLLO_OPTIONS } from "apollo-angular";
import {
  ApplicationConfig,
  inject,
  InjectionToken,
  makeStateKey,
  TransferState,
} from "@angular/core";
import {
  ApolloClientOptions,
  FieldMergeFunction,
  from,
  InMemoryCache,
  split,
} from "@apollo/client/core";
import { Router } from "@angular/router";
import { onError } from "@apollo/client/link/error";
import { NbToastrService } from "@nebular/theme";
import { Kind, OperationDefinitionNode } from "graphql/language";
import { Maybe, Node, StrictTypedTypePolicies } from "~/graphql";
import { ErrorCode } from "~shared/apierror";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { setContext } from "@apollo/client/link/context";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { createClient } from "graphql-ws";

const uri = "/graphql";

const APOLLO_CACHE = new InjectionToken<InMemoryCache>("apollo-cache");
const STATE_KEY = makeStateKey<any>("apollo.state");

export function apolloOptionsFactory(
  cache: InMemoryCache,
  transferState: TransferState,
  toastrService: NbToastrService,
  router: Router,
): ApolloClientOptions<any> {
  const isBrowser = transferState.hasKey<any>(STATE_KEY);

  const basePath = isBrowser ? window.location.host : "apiserver:3000";
  const scheme = isBrowser ? window.location.protocol : "http:";
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

  const errorLink = onError(({ graphQLErrors, operation }) => {
    if (graphQLErrors == null) return;
    graphQLErrors.forEach((err) => {
      const code = <ErrorCode>err.extensions?.["code"];

      if (code === "AUTHENTICATION_REQUIRED") {
        if (
          operation.query.definitions.find(
            (x): x is OperationDefinitionNode =>
              x.kind === Kind.OPERATION_DEFINITION,
          )?.operation === "query"
        )
          return;

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

  const http = createUploadLink({
    uri: `${scheme}//${basePath}${uri}`,
  });

  let ws: GraphQLWsLink | undefined;
  if (isBrowser)
    ws = new GraphQLWsLink(
      createClient({
        url: `${scheme == "http:" ? "ws:" : "wss:"}//${basePath}${uri}`,
      }),
    );

  const link = from([
    setContext((_, previous) => ({
      ...previous,
      headers: { cookie: cookies ?? "token=_" },
    })),
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

const sortedMerge: (existingMerge: FieldMergeFunction) => FieldMergeFunction =
  (existingMerge) =>
  (
    existing: { edges: Maybe<{ node: Node }>[] },
    incoming: { edges: Maybe<{ node: Node }>[] },
    args,
  ) => {
    const merged = existingMerge(existing, incoming, args);

    const firstIncomingId = incoming?.edges[0]?.node.id as string | undefined;
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
  };

export const graphqlProvider: ApplicationConfig["providers"] = [
  Apollo,
  {
    provide: APOLLO_CACHE,
    useFactory: () =>
      new InMemoryCache({
        possibleTypes: {
          BasePost: ["Comment", "TopPost"],
        },
        typePolicies: {
          Query: {
            fields: {
              homefeed: relayStylePagination(["sortOptions", "ignoreFollows"]),
              users: relayStylePagination(["filter"]),
              subs: relayStylePagination(["filter"]),
              searchPosts: relayStylePagination(["input"]),
            },
          },
          Sub: {
            fields: {
              moderators: relayStylePagination(),
              posts: relayStylePagination(["sortOptions"]),
              banned: relayStylePagination(["filter"]),
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
          Conversation: {
            fields: {
              messages: {
                ...relayStylePagination(["target"]),
                merge: sortedMerge(
                  relayStylePagination(["target"]).merge as FieldMergeFunction,
                ),
              },
            },
          },
          User: {
            fields: {
              notifications: {
                ...relayStylePagination([]),
                merge: sortedMerge(
                  relayStylePagination().merge as FieldMergeFunction,
                ),
              },
            },
          },
        } satisfies StrictTypedTypePolicies,
      }),
  },
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
    deps: [APOLLO_CACHE, TransferState, NbToastrService, Router],
  },
];
