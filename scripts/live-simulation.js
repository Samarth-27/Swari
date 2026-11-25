import { chromium } from 'playwright';

async function runLiveSimulation() {
  console.log('🚀 Launching visible Google Chrome browser on Windows desktop...');

  const timestamp = Date.now().toString().slice(-4);
  const user1Name = `Arjun ${timestamp}`;
  const user2Name = `Pooja ${timestamp}`;
  const user1Email = `arjun.driver.${timestamp}@swari.test`;
  const user2Email = `pooja.pax.${timestamp}@swari.test`;
  const password = `SecurePass123!`;

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'chrome',
      headless: false,
      slowMo: 600,
      args: ['--start-maximized', '--window-size=1366,768']
    });
  } catch (err) {
    console.log('Falling back to bundled chromium:', err.message);
    browser = await chromium.launch({
      headless: false,
      slowMo: 600,
      args: ['--start-maximized', '--window-size=1366,768']
    });
  }

  const context = await browser.newContext({
    viewport: { width: 1366, height: 768 }
  });
  const page = await context.newPage();

  console.log('🌐 Step 1: Navigating to http://localhost:8000');
  await page.goto('http://localhost:8000', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);

  // If Error Boundary button "Reload Swari" is present, click it
  const reloadBtn = page.locator('button:has-text("Reload Swari"), button:has-text("Try Again")');
  if (await reloadBtn.isVisible()) {
    console.log('Clicking Reload Swari button...');
    await reloadBtn.click();
    await page.waitForTimeout(1500);
  }

  // =========================================================================
  // ACT 1: Create Account 1 (Driver: Arjun Verma) & Publish Ride 1
  // =========================================================================
  console.log('\n📝 Step 2: Creating Account 1 (Driver: Arjun Verma)');
  const userSwitcherBtn = page.locator('button[title*="Switch user account"]').first();
  await userSwitcherBtn.click();
  await page.waitForTimeout(1000);

  // Click "Create Account" tab in Identity modal
  await page.locator('button:has-text("Create Account")').click();
  await page.waitForTimeout(800);

  // Select Driver Role
  await page.locator('button:has-text("Car Owner")').click();
  await page.waitForTimeout(600);

  // Fill Registration Form
  await page.locator('input[placeholder*="Aditya Verma"]').fill(user1Name);
  await page.locator('input[placeholder*="aditya@swari.in"]').fill(user1Email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[placeholder*="98765-43210"]').fill('9876543210');
  await page.locator('input[placeholder*="Nexon EV"]').fill('Tata Nexon EV');
  await page.locator('input[placeholder*="KA 05 AB 1234"]').fill(`DL 01 AB ${timestamp}`);
  await page.waitForTimeout(800);

  // Submit Sign Up
  console.log('Submitting Account 1 Registration...');
  await page.locator('button:has-text("Register & Authorize Session")').click();
  await page.waitForTimeout(2000);

  console.log('🚗 Step 3: Account 1 (Arjun Verma) publishes Ride 1 (Bengaluru -> Chennai)');
  const publishBtn = page.locator('header button:has-text("Publish a ride")').first();
  await publishBtn.click();
  await page.waitForTimeout(1200);

  // Wait for Post Ride Modal to open
  await page.waitForSelector('text=Publish a Carpool Ride', { timeout: 10000 });

  // Cancel any existing trip if blocking notice appears
  const cancelExistingBtn = page.locator('button:has-text("Cancel Existing Trip")');
  if (await cancelExistingBtn.isVisible()) {
    await cancelExistingBtn.click();
    await page.waitForTimeout(1200);
    await publishBtn.click();
    await page.waitForTimeout(1000);
  }

  // Advance steps through modal
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);

  // Publish Trip Live
  console.log('Publishing Arjun\'s Trip Live...');
  await page.locator('button:has-text("Publish Trip Live")').click();
  await page.waitForTimeout(2500);

  // =========================================================================
  // ACT 2: Create Account 2 (Passenger: Pooja Sharma) & Book Ride 1
  // =========================================================================
  console.log('\n📝 Step 4: Creating Account 2 (Passenger: Pooja Sharma)');
  await userSwitcherBtn.click();
  await page.waitForTimeout(1000);

  await page.locator('button:has-text("Create Account")').click();
  await page.waitForTimeout(800);

  // Passenger role is default, fill form
  await page.locator('input[placeholder*="Aditya Verma"]').fill(user2Name);
  await page.locator('input[placeholder*="aditya@swari.in"]').fill(user2Email);
  await page.locator('input[type="password"]').fill(password);
  await page.locator('input[placeholder*="98765-43210"]').fill('9876543211');
  await page.waitForTimeout(800);

  console.log('Submitting Account 2 Registration...');
  await page.locator('button:has-text("Register & Authorize Session")').click();
  await page.waitForTimeout(2500);

  console.log('🔍 Step 5: Account 2 (Pooja Sharma) searches for Arjun\'s ride');
  await page.locator('button:has-text("Find Rides")').first().click();
  await page.waitForTimeout(1200);

  // Find Arjun's ride card
  const arjunCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: user1Name }).first();
  await arjunCard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1000);
  await arjunCard.click();
  await page.waitForTimeout(1500);

  // Verify Ride Details Modal opened
  await page.waitForSelector('text=Trip Route & Landmark Pickup Points', { timeout: 10000 });

  console.log('💳 Step 6: Account 2 books Arjun\'s ride via SafePay Escrow');
  const bookBtn = page.locator('button:has-text("Continue to SafePay"), button:has-text("Request Seat")').first();
  await bookBtn.scrollIntoViewIfNeeded();
  await bookBtn.click();
  await page.waitForTimeout(1500);

  // Verify Payment step opened
  await page.waitForSelector('text=SafePay UPI Escrow Checkout', { timeout: 10000 });
  const escrowBtn = page.locator('button:has-text("Authorize Escrow Lock")').first();
  await escrowBtn.scrollIntoViewIfNeeded();
  await escrowBtn.click();
  console.log('✅ Seat locked in escrow! Booking confirmed for Pooja Sharma!');
  await page.waitForTimeout(2000);

  // Dismiss modal cleanly via Return to Search or Escape
  const returnBtn = page.locator('button:has-text("Return to Search")').first();
  if (await returnBtn.isVisible()) {
    await returnBtn.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1200);

  // View booked trip in My Rides
  console.log('📋 Viewing Pooja\'s confirmed booking in My Rides Dashboard...');
  await page.locator('button:has-text("My Rides")').first().click();
  await page.waitForTimeout(3000);

  // =========================================================================
  // ACT 3: Account 2 (Pooja Sharma) Publishes Reciprocal Ride 2
  // =========================================================================
  console.log('\n🚗 Step 7: Account 2 (Pooja Sharma) publishes reciprocal ride');
  const publishBtn2 = page.locator('header button:has-text("Publish a ride")').first();
  await publishBtn2.click();
  await page.waitForTimeout(1500);

  // Wait for modal to open
  await page.waitForSelector('text=Publish a Carpool Ride', { timeout: 10000 });

  // Cancel any existing trip if blocking notice appears
  const cancelExistingBtn2 = page.locator('button:has-text("Cancel Existing Trip")');
  if (await cancelExistingBtn2.isVisible()) {
    console.log('Clearing previous active trip slot for Account 2...');
    await cancelExistingBtn2.click();
    await page.waitForTimeout(1200);
    await publishBtn2.click();
    await page.waitForTimeout(1000);
  }

  // Advance steps
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Continue")').click();
  await page.waitForTimeout(800);

  console.log('Publishing Pooja\'s Reciprocal Trip Live...');
  await page.locator('button:has-text("Publish Trip Live")').click();
  await page.waitForTimeout(2500);

  // =========================================================================
  // ACT 4: Switch Back to Account 1 (Arjun Verma) & Book Pooja's Ride
  // =========================================================================
  console.log('\n👤 Step 8: Switching back to Account 1 (Arjun Verma)');
  await userSwitcherBtn.click();
  await page.waitForTimeout(1000);

  // Switch via Sign In tab with email & password
  await page.locator('button:has-text("Sign In")').click();
  await page.waitForTimeout(800);
  await page.locator('input#login-email').fill(user1Email);
  await page.locator('input#login-password').fill(password);
  await page.waitForTimeout(800);
  await page.locator('button:has-text("Sign In with Secure Session")').click();
  await page.waitForTimeout(2500);

  console.log('🔍 Step 9: Account 1 (Arjun Verma) finds & books Pooja\'s ride');
  await page.locator('button:has-text("Find Rides")').first().click();
  await page.waitForTimeout(1200);

  const poojaCard = page.locator('div[class*="cursor-pointer"]').filter({ hasText: user2Name }).first();
  await poojaCard.scrollIntoViewIfNeeded();
  await poojaCard.click();
  await page.waitForTimeout(1500);

  await page.waitForSelector('text=Trip Route & Landmark Pickup Points', { timeout: 10000 });
  const bookReciprocalBtn = page.locator('button:has-text("Continue to SafePay"), button:has-text("Request Seat")').first();
  await bookReciprocalBtn.scrollIntoViewIfNeeded();
  await bookReciprocalBtn.click();
  await page.waitForTimeout(1500);

  await page.waitForSelector('text=SafePay UPI Escrow Checkout', { timeout: 10000 });
  const escrowReciprocalBtn = page.locator('button:has-text("Authorize Escrow Lock")').first();
  await escrowReciprocalBtn.scrollIntoViewIfNeeded();
  await escrowReciprocalBtn.click();
  console.log('✅ Seat locked in escrow! Arjun Verma confirmed on Pooja\'s ride!');
  await page.waitForTimeout(2000);

  const returnBtn2 = page.locator('button:has-text("Return to Search")').first();
  if (await returnBtn2.isVisible()) {
    await returnBtn2.click();
  } else {
    await page.keyboard.press('Escape');
  }
  await page.waitForTimeout(1200);

  // =========================================================================
  // FINAL: Display Dashboard & Summary
  // =========================================================================
  console.log('\n🎉 Step 10: Displaying My Rides Dashboard with reciprocal trips');
  await page.locator('button:has-text("My Rides")').first().click();
  await page.waitForTimeout(4000);

  console.log('\n======================================================');
  console.log('🏆 RECIPROCAL TWO-WAY PUBLISH & BOOK COMPLETE!');
  console.log('1. Account 1 (Arjun Verma - Driver) created & published ride');
  console.log('2. Account 2 (Pooja Sharma - Passenger) created & booked Arjun\'s ride');
  console.log('3. Account 2 (Pooja Sharma) published reciprocal ride');
  console.log('4. Account 1 (Arjun Verma) logged in & booked Pooja\'s ride');
  console.log('======================================================');
  console.log('Simulation complete! Keeping browser open for your live view.');

  // Leave open for live inspection (10 minutes)
  await page.waitForTimeout(600000);
  await browser.close();
}

runLiveSimulation().catch(err => {
  console.error('Simulation error:', err);
  process.exit(1);
});
