
from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        print("Navigating to app...")
        page.goto("http://localhost:3000")

        # 1. Type into the input
        print("Typing 'test-user-keep-state'...")
        github_input = page.locator("input#github-url")
        expect(github_input).to_be_visible()
        github_input.fill("test-user-keep-state")

        # 2. Mock API failure to force error state
        page.route("**/*", lambda route: route.abort() if "github.com" in route.request.url or "api" in route.request.url else route.continue_())

        # 3. Click analyze
        print("Clicking analyze...")
        # The button has aria-label="分析个人资料"
        analyze_button = page.get_by_role("button", name="分析个人资料")
        analyze_button.click()

        # 4. Wait for Error Screen
        print("Waiting for error screen...")
        try:
             # Wait for text "分析失败"
             expect(page.get_by_text("分析失败")).to_be_visible(timeout=5000)
        except:
             print("Loading... waiting more")
             expect(page.get_by_text("分析失败")).to_be_visible(timeout=10000)

        # 5. Click Retry
        print("Clicking Retry...")
        retry_button = page.get_by_role("button", name="重试")
        retry_button.click()

        # 6. Verify state preservation
        print("Verifying state preservation...")
        expect(github_input).to_be_visible()
        expect(github_input).to_have_value("test-user-keep-state")

        print("SUCCESS: State was preserved!")
        page.screenshot(path="verification/state_preserved.png")

    except Exception as e:
        print(f"Test failed: {e}")
        page.screenshot(path="verification/failure.png")
    finally:
        browser.close()

if __name__ == "__main__":
    with sync_playwright() as playwright:
        run(playwright)
