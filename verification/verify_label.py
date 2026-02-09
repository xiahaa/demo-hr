from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000/")

    # Wait for the page to load
    page.wait_for_selector("text=GitHub 个人资料 URL")

    # Verify the label exists and is associated with the input
    label = page.locator("label[for='github-url']")
    if label.is_visible():
        print("Label is visible")
    else:
        print("Label is NOT visible")

    # Verify input has the correct id
    input_field = page.locator("input#github-url")
    if input_field.is_visible():
        print("Input field is visible and has correct ID")
    else:
        print("Input field is NOT visible or missing ID")

    # Take screenshot
    page.screenshot(path="verification/verification.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
