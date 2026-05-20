import { test, expect } from "@playwright/test";

test.describe("US1: Sign In", () => {
  test("unauthenticated user is redirected to sign-in page", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/auth\/signin/);
  });

  test("Dev Login button is visible when NEXT_PUBLIC_DEV_AUTH=true", async ({
    page,
  }) => {
    await page.goto("/auth/signin");
    // Dev Login button should be present in dev mode
    const devButton = page.getByTestId("dev-login-button");
    await expect(devButton).toBeVisible();
  });

  test("after Dev Login session persists on reload", async ({ page }) => {
    await page.goto("/auth/signin");
    await page.getByTestId("dev-login-button").click();
    // Should redirect away from sign-in
    await expect(page).not.toHaveURL(/\/auth\/signin/);
    // Reload and check still authenticated
    await page.reload();
    await expect(page).not.toHaveURL(/\/auth\/signin/);
  });

  test("sign-in page shows when no session exists", async ({ page }) => {
    await page.goto("/auth/signin");
    await expect(page.getByRole("heading")).toBeVisible();
  });
});
