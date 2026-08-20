import { test as base } from "@playwright/test";

interface ConsoleFixtures {
  consoleErrors: string[];
  pageErrors: string[];
}

export const test = base.extend<ConsoleFixtures>({
  consoleErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await provide(errors);
  },
  pageErrors: async ({ page }, provide) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await provide(errors);
  },
});

export { expect } from "@playwright/test";
