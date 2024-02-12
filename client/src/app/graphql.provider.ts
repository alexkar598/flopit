import {Apollo, APOLLO_OPTIONS} from "apollo-angular";
import {HttpLink} from "apollo-angular/http";
import {
  ApplicationConfig,
  inject,
  InjectionToken,
  makeStateKey,
  TransferState,
} from "@angular/core";
import {ApolloClientOptions, InMemoryCache} from "@apollo/client/core";

const uri = "/graphql";

const APOLLO_CACHE = new InjectionToken<InMemoryCache>("apollo-cache");
const STATE_KEY = makeStateKey<any>("apollo.state");

export function apolloOptionsFactory(
  httpLink: HttpLink,
  cache: InMemoryCache,
  transferState: TransferState,
): ApolloClientOptions<any> {
  const isBrowser = transferState.hasKey<any>(STATE_KEY);

  if (isBrowser) {
    const state = transferState.get<any>(STATE_KEY, null);
    cache.restore(state);
  } else {
    transferState.onSerialize(STATE_KEY, () => {
      return cache.extract();
    });
    // Reset cache after extraction to avoid sharing between requests
    cache.reset();
  }

  return {
    link: httpLink.create({uri}),
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
    deps: [HttpLink, APOLLO_CACHE, TransferState],
  },
];
