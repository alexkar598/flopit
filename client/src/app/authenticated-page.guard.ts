import { CanActivateFn, Router } from "@angular/router";
import { inject, PLATFORM_ID } from "@angular/core";
import { UserService } from "~/app/services/user.service";
import { filter, map, tap } from "rxjs";
import { isPlatformServer } from "@angular/common";

export const authenticatedPageGuard: CanActivateFn = (route, state) => {
  const platformId = inject(PLATFORM_ID);
  if (isPlatformServer(platformId)) return true;
  const userService = inject(UserService);
  const router = inject(Router);

  return userService.currentUser$.pipe(
    filter((x) => x !== undefined),
    map((x) => (x ? true : router.parseUrl("/"))),
  );
};
