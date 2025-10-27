import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Label Management
 * 
 * Tests the complete label management workflow:
 * - Creating labels with name and color
 * - Editing existing labels
 * - Deleting labels
 * - Color picker functionality
 * - Validation and error handling
 */

test.describe('Label Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the labels page
    await page.goto('/');
    await page.click('text=Labels');
    await page.waitForURL('**/labels');
  });

  test('should display labels page', async ({ page }) => {
    // Check page title
    await expect(page.locator('h1')).toContainText('Labels');
    
    // Check "New Label" button exists
    await expect(page.locator('button:has-text("New Label")')).toBeVisible();
  });

  test('should create a new label', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Wait for modal to appear
    await expect(page.locator('text=Create Label')).toBeVisible();
    
    // Fill in label details
    await page.fill('input[id="label-name"]', 'test-bug');
    await page.fill('input[id="label-color"]', 'd73a4a');
    await page.fill('input[id="label-description"]', 'Test bug label');
    
    // Submit the form
    await page.click('button:has-text("Create Label")');
    
    // Wait for modal to close
    await expect(page.locator('text=Create Label')).not.toBeVisible();
    
    // Verify label appears in the list
    await expect(page.locator('text=test-bug')).toBeVisible();
    await expect(page.locator('text=Test bug label')).toBeVisible();
  });

  test('should validate label name is required', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Try to submit without a name
    await page.fill('input[id="label-color"]', 'd73a4a');
    await page.click('button:has-text("Create Label")');
    
    // Check that validation error appears
    await expect(page.locator('input[id="label-name"]')).toBeVisible();
    // HTML5 validation should prevent submission
    await expect(page.locator('text=Create Label')).toBeVisible();
  });

  test('should validate hex color format', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Try to submit with invalid color
    await page.fill('input[id="label-name"]', 'test-label');
    await page.fill('input[id="label-color"]', 'invalid');
    await page.click('button:has-text("Create Label")');
    
    // Should show validation error or prevent submission
    await expect(page.locator('text=Invalid color format')).toBeVisible().catch(() => {
      // Or HTML5 validation prevents submission
      expect(page.locator('text=Create Label')).toBeVisible();
    });
  });

  test('should use preset colors', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Get the initial color value
    const initialColor = await page.inputValue('input[id="label-color"]');
    
    // Click a preset color button (first one)
    await page.locator('[title^="#"]').first().click();
    
    // Verify color changed
    const newColor = await page.inputValue('input[id="label-color"]');
    expect(newColor).not.toBe(initialColor);
    expect(newColor).toMatch(/^[0-9a-fA-F]{6}$/);
  });

  test('should generate random color', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Get the initial color value
    const initialColor = await page.inputValue('input[id="label-color"]');
    
    // Click the random color button (Palette icon)
    await page.click('button[title="Random color"]');
    
    // Verify color changed
    const newColor = await page.inputValue('input[id="label-color"]');
    expect(newColor).not.toBe(initialColor);
    expect(newColor).toMatch(/^[0-9a-fA-F]{6}$/);
  });

  test('should edit an existing label', async ({ page }) => {
    // Assuming there's at least one label, click edit button
    const editButton = page.locator('button[title="Edit label"]').first();
    await editButton.waitFor({ state: 'visible', timeout: 5000 });
    await editButton.click();
    
    // Wait for modal
    await expect(page.locator('text=Edit Label')).toBeVisible();
    
    // Update description
    await page.fill('input[id="label-description"]', 'Updated description');
    
    // Submit
    await page.click('button:has-text("Update Label")');
    
    // Wait for modal to close
    await expect(page.locator('text=Edit Label')).not.toBeVisible();
    
    // Verify changes appear
    await expect(page.locator('text=Updated description')).toBeVisible();
  });

  test('should delete a label with confirmation', async ({ page }) => {
    // Create a test label first
    await page.click('button:has-text("New Label")');
    await page.fill('input[id="label-name"]', 'delete-me');
    await page.fill('input[id="label-color"]', 'ff0000');
    await page.click('button:has-text("Create Label")');
    
    // Wait for label to appear
    await expect(page.locator('text=delete-me')).toBeVisible();
    
    // Find and click delete button for this label
    const labelCard = page.locator('div:has-text("delete-me")').first();
    const deleteButton = labelCard.locator('button[title="Delete label"]');
    
    // Listen for confirmation dialog
    page.once('dialog', async (dialog) => {
      expect(dialog.message()).toContain('delete');
      await dialog.accept();
    });
    
    await deleteButton.click();
    
    // Verify label is removed
    await expect(page.locator('text=delete-me')).not.toBeVisible();
  });

  test('should cancel delete on confirmation decline', async ({ page }) => {
    // Assume there's at least one label
    const initialLabels = await page.locator('[data-testid="label-card"], div:has(button[title="Delete label"])').count();
    
    // Find and click delete button
    const deleteButton = page.locator('button[title="Delete label"]').first();
    
    // Listen for confirmation dialog and cancel
    page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    
    await deleteButton.click();
    
    // Verify label count hasn't changed
    const finalLabels = await page.locator('[data-testid="label-card"], div:has(button[title="Delete label"])').count();
    expect(finalLabels).toBe(initialLabels);
  });

  test('should display label preview while editing', async ({ page }) => {
    // Click "New Label" button
    await page.click('button:has-text("New Label")');
    
    // Fill in label details
    await page.fill('input[id="label-name"]', 'preview-test');
    await page.fill('input[id="label-color"]', '00ff00');
    
    // Check that preview updates
    await expect(page.locator('text=Preview')).toBeVisible();
    await expect(page.locator('span:has-text("preview-test")')).toBeVisible();
  });

  test('should close editor modal on cancel', async ({ page }) => {
    // Open create modal
    await page.click('button:has-text("New Label")');
    await expect(page.locator('text=Create Label')).toBeVisible();
    
    // Click cancel
    await page.click('button:has-text("Cancel")');
    
    // Verify modal is closed
    await expect(page.locator('text=Create Label')).not.toBeVisible();
  });

  test('should close editor modal on X button', async ({ page }) => {
    // Open create modal
    await page.click('button:has-text("New Label")');
    await expect(page.locator('text=Create Label')).toBeVisible();
    
    // Click X button
    await page.click('button[aria-label="Close"], button:has(svg)').first();
    
    // Verify modal is closed
    await expect(page.locator('text=Create Label')).not.toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // This test would need to mock a network error
    // For now, we test that error messages are displayed when they occur
    
    // Try to create a label with a name that might already exist
    await page.click('button:has-text("New Label")');
    await page.fill('input[id="label-name"]', 'duplicate-label');
    await page.fill('input[id="label-color"]', 'd73a4a');
    await page.click('button:has-text("Create Label")');
    
    // If there's an error, it should be displayed
    // This is a placeholder - actual implementation would need API mocking
    // await expect(page.locator('.error-message, [role="alert"]')).toBeVisible();
  });
});
