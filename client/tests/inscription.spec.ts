import { expect, test } from "@playwright/test";

test.describe("Page d'inscription", () => {
  const appUrl = process.env["APP_URL"] ?? "http://localhost:8080";
  const url = new URL("/inscription", appUrl).toString();

  test.beforeEach("naviguer vers la page", async ({ page }) => {
    await page.goto(url);
  });

  test("doit avoir le bon titre", async ({ page }) => {
    await expect(page).toHaveTitle("Inscription - FlopIt");
  });

  test("ne doit pas permettre de soumettre un formulaire vide", async ({
    page,
  }) => {
    await page.locator("form button").last().click();

    await expect(page.locator("nb-toast")).toHaveCount(2);
  });

  test("ne doit pas permettre un mot de passe faible", async ({ page }) => {
    const id = new Date().getTime().toString(36);
    const password = "123456";

    await page.locator("#courriel").fill(`test-${id}@test.test`);
    await page.locator("#nom-utilisateur").fill("test-" + id);
    await page.locator("#mot-passe").fill(password);
    await page.locator("#mot-passe-confirmation").fill(password);

    const response = page.waitForResponse(/\/graphql/);
    await page.locator("form button").last().click();
    await response;

    await expect(page.locator("nb-toast")).toHaveCount(1);
  });

  test("doit créer un compte et s'authentifier lorsque le formulaire est valide", async ({
    page,
    context,
  }) => {
    const id = new Date().getTime().toString(36);
    const username = "test-" + id;

    await page.locator("#courriel").fill(username + "@test.test");
    await page.locator("#nom-utilisateur").fill(username);
    await page.locator("#mot-passe").fill(id);
    await page.locator("#mot-passe-confirmation").fill(id);

    await page.locator("form button").last().click();

    await page.waitForURL(new URL(appUrl).toString(), { timeout: 30000 });

    await expect(page.locator(".user-name").first()).toHaveText(username);

    const cookies = await context.cookies();
    expect(cookies.find((c) => c.name === "token")).toBeDefined();
  });
});
