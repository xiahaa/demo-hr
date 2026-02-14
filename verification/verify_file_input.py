import os
from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # Go to localhost
    print("Navigating to page...")
    page.goto("http://localhost:3000")

    # Wait for the page to load
    page.wait_for_load_state("networkidle")

    # Locate the file input section
    # The label text is "上传简历 PDF (可选)"
    # We want to verify the new drag-and-drop zone text "点击上传简历 PDF"

    print("Checking for upload zone...")
    upload_text = page.get_by_text("点击上传简历 PDF")

    if upload_text.is_visible():
        print("Upload zone is visible: YES")
    else:
        print("Upload zone is visible: NO")

    # Take a screenshot of the entire page
    os.makedirs("verification", exist_ok=True)
    screenshot_path = "verification/landing_page.png"
    page.screenshot(path=screenshot_path, full_page=True)
    print(f"Screenshot saved to {screenshot_path}")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
