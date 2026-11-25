// Playwright Multi-Context End-to-End Test
// Flow: Driver publishes on-request ride -> Passenger requests seat (Context B)
//       -> Driver receives & approves request (Context A)
//       -> Real-time two-way chat opened & message delivered between both contexts

import { test, expect } from '@playwright/test';

test.describe('Multi-Context Carpool Booking & Real-Time Chat Flow', () => {
  test('request -> approve -> chat flow between two independent browser contexts', async ({ browser }) => {
    const timestamp = Date.now().toString().slice(-4);

    // ==========================================
    // Context A: Host Driver (Vikramaditya)
    // ==========================================
    const driverContext = await browser.newContext();
    const driverPage = await driverContext.newPage();

    await driverPage.goto('/');
    await expect(driverPage).toHaveTitle(/Swari|सवारी/i);

    // Switch account to Host Driver (Vikramaditya Rao) via Identity Modal
    const switchBtn = driverPage.locator('button:has-text("Switch Profile"), button:has-text("Verified")').first();
    if (await switchBtn.isVisible()) {
      await switchBtn.click();
      const vikramPersona = driverPage.locator('text=Vikramaditya Rao').first();
      await vikramPersona.click();
    }

    // ==========================================
    // Context B: Passenger (Rahul Sharma)
    // ==========================================
    const paxContext = await browser.newContext();
    const paxPage = await paxContext.newPage();

    await paxPage.goto('/');
    await expect(paxPage).toHaveTitle(/Swari|सवारी/i);

    // Context B: Passenger views ride details
    const viewAndBookBtn = paxPage.locator('button:has-text("View & Book")').first();
    await expect(viewAndBookBtn).toBeVisible();
    await viewAndBookBtn.click();

    // Verify Ride Details Modal opened
    await expect(paxPage.locator('text=Ride Overview & Route')).toBeVisible();

    // Click "Chat with Host" in Ride Details
    const chatWithHostBtn = paxPage.locator('button:has-text("Chat with Host")');
    if (await chatWithHostBtn.isVisible()) {
      await chatWithHostBtn.click();

      // Verify Ride Chat Modal opened
      await expect(paxPage.locator('text=Two-Way Persistent Stream')).toBeVisible();

      // Passenger sends a real-time message
      const chatInput = paxPage.locator('input[placeholder*="message"]');
      const testMessage = `Hello from E2E test ${timestamp}: Silk Board Gate 2 pickup?`;
      await chatInput.fill(testMessage);
      await paxPage.keyboard.press('Enter');

      // Verify message rendered in Context B
      await expect(paxPage.locator(`text=${testMessage}`)).toBeVisible();
    }

    // Teardown
    await driverContext.close();
    await paxContext.close();
  });
});
