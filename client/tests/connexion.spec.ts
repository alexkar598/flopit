import { expect, test } from "@playwright/test";

test.describe("Page de connexion", () => {
  const appUrl = process.env["APP_URL"] ?? "http://localhost:8080";
  const url = new URL("/connexion", appUrl).toString();

  test.beforeEach("naviguer vers la page", async ({ page }) => {
    await page.goto(url);
  });

  test("doit avoir le bon titre", async ({ page }) => {
    await expect(page).toHaveTitle("Connexion - FlopIt");
  });

  test("ne doit pas se connecter avec un mot de passe invalide", async ({
    page,
  }) => {
    await page.locator("#email").fill("Aurore.Lefevre@hotmail.com");
    await page.locator("#password").fill("invalide");

    await page.locator("form button").last().click();

    await expect(page.locator("nb-toast")).toHaveCount(1, { timeout: 60000 });
  });

  test("doit se connecter avec les informations valides", async ({ page }) => {
    await page.locator("#email").fill("Aurore.Lefevre@hotmail.com");
    await page.locator("#password").fill("123456");

    await page.locator("form button").last().click();
    await page.waitForURL(appUrl, { timeout: 60000 });

    await expect(page.locator(".user-name").first()).toHaveText(
      "Aurore_Lefevre",
    );
  });
});
