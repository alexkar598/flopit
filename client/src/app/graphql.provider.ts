import { relayStylePagination } from "@apollo/client/utilities";
import { Apollo, APOLLO_OPTIONS } from "apollo-angular";
import {
  ApplicationConfig,
  inject,
  InjectionToken,
  makeStateKey,
  TransferState,
} from "@angular/core";
import { Router } from "@angular/router";
import { ApolloClientOptions, from, InMemoryCache } from "@apollo/client/core";
import { onError } from "@apollo/client/link/error";
import { NbToastrService } from "@nebular/theme";
import { Kind, OperationDefinitionNode } from "graphql/language";
import { StrictTypedTypePolicies } from "~/graphql";
import { ErrorCode } from "~shared/apierror";
import createUploadLink from "apollo-upload-client/createUploadLink.mjs";
import { setContext } from "@apollo/client/link/context";

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

  const basePath = isBrowser ? "" : "http://apiserver:3000";
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

  const link = from([
    setContext((_, previous) => ({
      ...previous,
      headers: { cookie: cookies ?? "token=_" },
    })),
    errorLink,
    createUploadLink({
      uri: `${basePath}${uri}`,
    }),
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
        } satisfies StrictTypedTypePolicies,
      }),
  },
  {
    provide: APOLLO_OPTIONS,
    useFactory: apolloOptionsFactory,
    deps: [APOLLO_CACHE, TransferState, NbToastrService, Router],
  },
];
