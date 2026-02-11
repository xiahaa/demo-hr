from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()

    # 1. Navigate to the app
    print("Navigating to app...")
    page.goto("http://localhost:3000")

    # 2. Check for GitHub Analysis mode (default)
    print("Checking default mode...")
    # The "GitHub Analysis" button should be pressed
    github_btn = page.get_by_role("button", name="GitHub 分析")
    expect(github_btn).to_have_attribute("aria-pressed", "true")

    # Verify Landing component is visible
    expect(page.get_by_placeholder("GitHub URL（例如 github.com/torvalds）")).to_be_visible()

    page.screenshot(path="verification/github_analysis_mode.png")
    print("GitHub Analysis mode verified.")

    # 3. Switch to JD Match mode
    print("Switching to JD Match mode...")
    jd_btn = page.get_by_role("button", name="JD 匹配")
    jd_btn.click()

    # Verify "JD 匹配" button is pressed
    expect(jd_btn).to_have_attribute("aria-pressed", "true")

    # Verify JD Match form is visible
    # Look for "HR职位匹配分析" text (it's in a div in JDMatch.tsx)
    expect(page.get_by_text("HR职位匹配分析")).to_be_visible()
    expect(page.get_by_label("行业")).to_be_visible()

    page.screenshot(path="verification/jd_match_mode.png")
    print("JD Match mode verified.")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
