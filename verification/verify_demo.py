from playwright.sync_api import sync_playwright

def verify_demo():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Capture console logs
        page.on("console", lambda msg: print(f"Console: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"Page Error: {exc}"))

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:5173", timeout=60000)

            print("Waiting for root...")
            page.wait_for_selector("#root", state="attached")

            print("Taking debug screenshot...")
            page.screenshot(path="verification/debug.png")

            print("Waiting for content...")
            page.wait_for_selector("text=View Live Demo", timeout=5000)

            print("Clicking 'View Live Demo'...")
            page.get_by_text("View Live Demo").click()

            print("Waiting for results...")
            page.get_by_text("Sarah Chen").wait_for(timeout=10000)

            print("Taking result screenshot...")
            page.screenshot(path="verification/demo_result.png", full_page=True)
            print("Screenshot saved to verification/demo_result.png")

        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_demo()
