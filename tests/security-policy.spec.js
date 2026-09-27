'use strict';

const { test, expect } = require('@playwright/test');

test('policy blocks inline scripts while first-party notation still works', async ({ page }) => {
  await page.goto('/');
  const policy = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
  expect(policy).toContain("script-src 'self'");
  expect(policy).toContain("object-src 'none'");
  expect(policy).toContain("base-uri 'self'");

  await page.evaluate(() => {
    window.policyViolations = [];
    document.addEventListener('securitypolicyviolation', event => {
      window.policyViolations.push(event.violatedDirective);
    });
    const script = document.createElement('script');
    script.textContent = 'window.cspInlineProbe = true';
    document.head.appendChild(script);
  });
  await expect.poll(() => page.evaluate(() => window.policyViolations)).toContain('script-src-elem');
  expect(await page.evaluate(() => window.cspInlineProbe)).toBeUndefined();

  await page.getByRole('button', { name: 'Attend Singing School' }).click();
  await page.getByRole('button', { name: /WINDHAM/ }).click();
  await page.getByRole('button', { name: 'show the parts' }).click();
  await expect(page.locator('#harmony-plate svg')).toBeVisible({ timeout: 20_000 });
  expect(await page.evaluate(() => window.policyViolations)).toEqual(['script-src-elem']);
});
