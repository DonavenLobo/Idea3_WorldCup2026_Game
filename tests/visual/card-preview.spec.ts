import { expect, test } from "@playwright/test";

test.describe("card visual previews", () => {
  test("captures the level 00 sketch card render", async ({ page }, testInfo) => {
    await page.goto("/visual/card-preview", { waitUntil: "domcontentloaded" });

    const card = page.getByTestId("visual-card-preview-card");
    await expect(page.getByText("Visual Card Preview")).toBeVisible();
    await expect(card).toBeVisible();
    await expect(page.getByText("OVR")).toBeVisible();
    await expect(page.getByText("MIA GAFFA")).toBeVisible();

    await page.waitForTimeout(500);

    const box = await card.boundingBox();
    expect(box?.width).toBeGreaterThan(320);
    expect(box?.height).toBeGreaterThan(480);

    const screenshotPath = testInfo.outputPath("level-00-sketch-card.png");
    await card.screenshot({ path: screenshotPath });
    await testInfo.attach("level-00-sketch-card", {
      contentType: "image/png",
      path: screenshotPath
    });
  });
});
