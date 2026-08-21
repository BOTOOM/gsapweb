import type { Page } from "@playwright/test";
import { test, expect } from "./console.fixture";

async function waitForExperience(page: Page) {
  await expect(page.locator("canvas")).toBeVisible();
  await expect(page.locator('[data-state="ready"], [data-state="degraded"]')).toBeVisible({ timeout: 45_000 });
}

async function scrollToProgress(page: Page, progress: number) {
  await page.evaluate((value: number) => {
    window.scrollTo({ top: Math.round((document.documentElement.scrollHeight - window.innerHeight) * value), behavior: "instant" });
  }, progress);
  await page.waitForTimeout(700);
}

test.describe("narrative experience", () => {
  test("loads WebGL, visits scenes forward and backward, and keeps one timeline", async ({ page, consoleErrors, pageErrors }) => {
    await page.goto("/");
    await waitForExperience(page);

    const initialDebug = await page.evaluate(() => {
      const debug = (window as Window & { __storyDebug?: { timeline?: { scrollTrigger?: unknown } } }).__storyDebug;
      return Boolean(debug?.timeline?.scrollTrigger);
    });
    expect(initialDebug).toBe(true);

    const positions = [
      [0.34, "birds"],
      [0.5, "cats"],
      [0.65, "ramen"],
      [0.79, "basement"],
      [1, "mystery"],
    ] as const;
    for (const [progress, scene] of positions) {
      await scrollToProgress(page, progress);
      await expect(page.locator(`[data-active-scene="${scene}"]`)).toHaveCount(1);
    }

    const chestButton = page.locator(".chest-button");
    await expect(chestButton).toBeVisible();
    const chestLayout = await page.evaluate(() => {
      const element = document.querySelector<HTMLButtonElement>(".chest-button");
      if (!element) throw new Error("The chest interaction is not measurable");
      const rect = element.getBoundingClientRect();
      return {
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
        top: rect.top,
        viewportHeight: window.innerHeight,
        viewportWidth: window.innerWidth,
      };
    });
    expect(chestLayout.top).toBeGreaterThanOrEqual(0);
    expect(chestLayout.bottom).toBeLessThanOrEqual(chestLayout.viewportHeight);
    expect(chestLayout.left).toBeGreaterThanOrEqual(0);
    expect(chestLayout.right).toBeLessThanOrEqual(chestLayout.viewportWidth);
    const chestCenter = {
      x: (chestLayout.left + chestLayout.right) / 2,
      y: (chestLayout.top + chestLayout.bottom) / 2,
    };
    await page.mouse.click(chestCenter.x, chestCenter.y);
    await expect(page.locator('.visually-hidden[role="status"]')).toContainText("Golpe número 1");

    const beforeBack = await page.evaluate(() => ({ progress: (window as Window & { __storyDebug?: { timeline?: { scrollTrigger?: { progress?: number } } } }).__storyDebug?.timeline?.scrollTrigger?.progress }));
    await scrollToProgress(page, 0.18);
    await expect(page.locator('[data-active-scene="arrival"]')).toHaveCount(1);
    const afterBack = await page.evaluate(() => ({ progress: (window as Window & { __storyDebug?: { timeline?: { scrollTrigger?: { progress?: number } } } }).__storyDebug?.timeline?.scrollTrigger?.progress, state: document.querySelector("[data-state]")?.getAttribute("data-state") }));
    expect(afterBack.progress).toBeLessThan(beforeBack.progress ?? 1);
    expect(afterBack.state).toBe("ready");

    const timelineCount = await page.evaluate(() => {
      const debug = (window as Window & { __storyDebug?: { timeline?: { scrollTrigger?: unknown } } }).__storyDebug;
      return Number(Boolean(debug?.timeline?.scrollTrigger));
    });
    expect(timelineCount).toBe(1);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
  });

  test("continues in degraded mode when an optional model fails", async ({ page }) => {
    await page.route("**/assets/models/osprey.glb", (route) => route.abort());
    await page.goto("/");
    await waitForExperience(page);
    await scrollToProgress(page, 0.34);
    await expect(page.locator('[data-active-scene="birds"]')).toHaveCount(1);
    await expect(page.locator('[data-state="degraded"]')).toHaveCount(1);
    await expect(page.locator(".topline-status")).toContainText("Modo degradado");
  });

  test("keeps the composition usable with reduced motion", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    await waitForExperience(page);
    await scrollToProgress(page, 0.5);
    await expect(page.locator('[data-active-scene="cats"]')).toHaveCount(1);
    const layout = await page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, viewport: window.innerWidth }));
    expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
  });
});
