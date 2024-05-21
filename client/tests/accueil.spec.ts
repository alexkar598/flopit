import { expect, test } from "@playwright/test";

test.describe("Page d'accueil", () => {
  const appUrl = process.env["APP_URL"] ?? "http://localhost:8080";

  test.beforeEach("naviguer vers la page", async ({ page }) => {
    await page.goto(appUrl);
  });

  test("doit avoir le bon titre", async ({ page }) => {
    await expect(page).toHaveTitle("FlopIt — Accueil");
  });

  test("doit avoir un bouton « S'inscrire » fonctionnel", async ({ page }) => {
    await page.locator('.connexion > a[href="/inscription"]').first().click();

    await expect(page).toHaveURL(/\/inscription$/);
  });

  test("doit avoir un bouton « Connexion » fonctionnel", async ({ page }) => {
    await page.locator('.connexion > a[href="/connexion"]').first().click();

    await expect(page).toHaveURL(/\/connexion$/);
  });

  test("doit avoir 20 publications", async ({ page }) => {
    await expect(page.locator("nb-list-item")).toHaveCount(20);
  });

  test("doit charger plus de publication lorsqu'on scroll", async ({
    page,
  }) => {
    const body = await page.$("body");
    const height = (await body?.boundingBox())?.height ?? 0;

    const response = page.waitForResponse(/\/graphql/);
    await page.mouse.wheel(0, height);
    await response;

    await expect(page.locator("nb-list-item")).toHaveCount(40);
  });
});
