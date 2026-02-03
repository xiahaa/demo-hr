from playwright.sync_api import sync_playwright, expect

def verify_loading_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:3000")

            # Click "Live Demo" to trigger loading
            print("Clicking Live Demo...")
            page.get_by_text("查看实时演示").click()

            # Wait for "Generating Insights" (生成洞察)
            print("Waiting for loading screen...")
            page.get_by_text("生成洞察").wait_for()

            # Check for role="status" (the text)
            print("Checking for status role...")
            # The text inside status changes, but the element has role="status"
            # We can find it by role
            status_element = page.get_by_role("status")
            expect(status_element).to_be_visible()

            # Check for role="progressbar"
            print("Checking for progressbar role...")
            progress_bar = page.get_by_role("progressbar", name="分析进度")
            expect(progress_bar).to_be_visible()

            # Take screenshot
            print("Taking screenshot...")
            page.screenshot(path="verification/loading_screen.png")
            print("Verification successful!")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error_loading.png")
            raise e
        finally:
            browser.close()

if __name__ == "__main__":
    verify_loading_a11y()
