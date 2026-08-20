import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        print("Navigating to login...")
        await page.goto("http://localhost:5173/")
        await page.wait_for_timeout(1000)

        # Login
        await page.fill('input[type="email"]', 'admin@example.com')
        await page.fill('input[type="password"]', 'admin123')
        await page.click('button[type="submit"]')
        
        await page.wait_for_timeout(2000)
        
        # Go to POS
        print("Navigating to POS...")
        await page.click('text=New Order')
        await page.wait_for_timeout(3000)
        
        print("Taking screenshot of POS...")
        await page.screenshot(path="pos_fixed.png")
        await browser.close()

asyncio.run(main())
