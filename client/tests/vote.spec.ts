import { expect, test } from "@playwright/test";

test.describe("Vote sur une publication", () => {
  const appUrl = process.env["APP_URL"] ?? "http://localhost:8080";

  test("ne doit pas augmenter le compteur lorsque déconnecté", async ({
    page,
  }) => {
    await page.goto(appUrl);

    const publication = page.locator("app-top-post-list-item").first();
    const votePositif = publication.locator(
      'app-vote button[title="Vote positif"]',
    );
    const affichageVotes = publication.locator("app-vote span");

    const votesInitial = parseInt(await affichageVotes.innerText());

    await votePositif.click();

    const votesFinal = parseInt(await affichageVotes.innerText());

    expect(votesFinal).toBe(votesInitial);
  });

  test("doit augmenter le compteur lorsque authentifié", async ({ page }) => {
    await page.goto(new URL("/connexion", appUrl).toString());

    await page.locator("#email").fill("Aurore.Lefevre@hotmail.com");
    await page.locator("#password").fill("123456");

    await page.locator("form button").last().click();
    await page.waitForURL(new URL(appUrl).toString(), { timeout: 20000 });

    const publication = page.locator("app-top-post-list-item").last();
    const votePositif = publication.locator(
      'app-vote button[title="Vote positif"]',
    );
    const affichageVotes = publication.locator("app-vote span");

    const votesInitial = parseInt(await affichageVotes.innerText());

    await votePositif.click();
    await page.waitForResponse(/\/graphql$/);

    expect(parseInt(await affichageVotes.innerText())).toBe(votesInitial + 1);

    await votePositif.click();
  });
});
