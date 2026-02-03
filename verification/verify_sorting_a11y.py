from playwright.sync_api import sync_playwright
import sys

def verify_sorting_a11y():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        try:
            print("Navigating to home page...")
            page.goto("http://localhost:5173", timeout=60000)

            print("Waiting for '查看实时演示' button...")
            page.wait_for_selector("text=查看实时演示", timeout=5000)

            print("Clicking '查看实时演示'...")
            page.get_by_text("查看实时演示").click()

            print("Waiting for results (sort buttons)...")
            # Wait for one of the sort buttons to appear
            stars_btn = page.get_by_role("button", name="星标")
            stars_btn.wait_for(timeout=10000)

            date_btn = page.get_by_role("button", name="日期")
            name_btn = page.get_by_role("button", name="名称")

            print("Checking initial state (Stars should be pressed)...")

            # This check is expected to FAIL before the fix
            stars_pressed = stars_btn.get_attribute("aria-pressed")
            date_pressed = date_btn.get_attribute("aria-pressed")

            print(f"Stars aria-pressed: {stars_pressed}")
            print(f"Date aria-pressed: {date_pressed}")

            if stars_pressed != "true":
                print("FAIL: 'Stars' button missing aria-pressed='true'")
                sys.exit(1)

            if date_pressed != "false":
                print("FAIL: 'Date' button missing aria-pressed='false'")
                sys.exit(1)

            print("Clicking 'Date' button...")
            date_btn.click()

            # Wait a tiny bit for React state update
            page.wait_for_timeout(500)

            stars_pressed_after = stars_btn.get_attribute("aria-pressed")
            date_pressed_after = date_btn.get_attribute("aria-pressed")

            if date_pressed_after != "true":
                 print(f"FAIL: 'Date' button not pressed after click (got {date_pressed_after})")
                 sys.exit(1)

            if stars_pressed_after != "false":
                 print(f"FAIL: 'Stars' button still pressed after clicking Date (got {stars_pressed_after})")
                 sys.exit(1)

            print("SUCCESS: Sort buttons have correct accessible states.")

        except Exception as e:
            print(f"Error: {e}")
            sys.exit(1)
        finally:
            browser.close()

if __name__ == "__main__":
    verify_sorting_a11y()
