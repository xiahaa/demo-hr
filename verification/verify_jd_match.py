from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    page = browser.new_page()
    page.goto("http://localhost:3000")

    # Wait for page to load
    page.wait_for_timeout(2000)

    # Click on "JD Match" (JD 匹配)
    # Depending on screen size, the layout might differ, but assuming desktop
    jd_btn = page.get_by_role("button", name="JD 匹配")
    if jd_btn.is_visible():
        jd_btn.click()

    # Wait for JD Match form
    expect(page.get_by_text("JD 匹配分析")).to_be_visible()

    # Check default state (Link selected)
    link_btn = page.get_by_role("button", name="链接")
    file_btn = page.get_by_role("button", name="上传文件")

    # Check aria-pressed
    expect(link_btn).to_have_attribute("aria-pressed", "true")
    expect(file_btn).to_have_attribute("aria-pressed", "false")

    # Switch to File Upload
    file_btn.click()

    # Check aria-pressed updated
    expect(link_btn).to_have_attribute("aria-pressed", "false")
    expect(file_btn).to_have_attribute("aria-pressed", "true")

    # Take a screenshot
    page.screenshot(path="verification/jd_match_accessibility.png")

    browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
