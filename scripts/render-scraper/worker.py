import os
from urllib.parse import urlparse

from flask import Flask, jsonify, request
from bs4 import BeautifulSoup

from selenium import webdriver
from selenium.webdriver.chrome.options import Options as ChromeOptions
from selenium.webdriver.chrome.service import Service as ChromeService


app = Flask(__name__)


def _extract_text(html_text: str, url: str) -> str:
    soup = BeautifulSoup(html_text, "html.parser")
    host = (urlparse(url).hostname or "").lower()

    if "reddit.com" in host:
        title = ""
        title_tag = soup.find("a", class_="title") or soup.find("h1")
        if title_tag:
            title = title_tag.get_text(" ", strip=True)

        body = ""
        body_container = soup.find("div", class_="expando") or soup.find("div", class_="md")
        if body_container:
            body = body_container.get_text(" ", strip=True)

        comments = []
        for c in soup.select("div.comment div.md")[:30]:
            text = c.get_text(" ", strip=True)
            if len(text) > 20:
                comments.append(text)

        reddit_text = []
        if title:
            reddit_text.append(f"Title: {title}")
        if body:
            reddit_text.append(f"Body: {body}")
        if comments:
            reddit_text.append("Top Comments:")
            reddit_text.extend([f"- {c}" for c in comments])

        combined = "\n".join(reddit_text).strip()
        if len(combined) >= 120:
            return combined

    for element in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        element.decompose()

    text = soup.get_text(separator="\n", strip=True)
    return text


def _scrape_with_selenium(url: str) -> tuple[bool, str]:
    options = ChromeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1366,1900")
    options.add_argument("--lang=en-US")
    options.add_argument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36")

    chrome_bin = os.getenv("CHROME_BIN")
    if chrome_bin:
        options.binary_location = chrome_bin

    driver = None
    try:
        chromedriver_path = os.getenv("CHROMEDRIVER_PATH")
        if chromedriver_path:
            service = ChromeService(executable_path=chromedriver_path)
            driver = webdriver.Chrome(service=service, options=options)
        else:
            driver = webdriver.Chrome(options=options)
        driver.set_page_load_timeout(20)
        driver.get(url)
        html = driver.page_source or ""
        if len(html) < 300:
            return False, "Selenium page source too short"

        extracted = _extract_text(html, url)
        if len(extracted) < 120:
            return False, "Insufficient extracted text"

        return True, extracted[:16000]
    except Exception as exc:
        return False, str(exc)
    finally:
        if driver is not None:
            try:
                driver.quit()
            except Exception:
                pass


@app.post("/scrape")
def scrape():
    token = os.getenv("SCRAPER_TOKEN", "")
    if token:
        auth = request.headers.get("Authorization", "")
        if auth != f"Bearer {token}":
            return jsonify({"success": False, "error": "Unauthorized"}), 401

    data = request.get_json(silent=True) or {}
    url = data.get("url")
    if not isinstance(url, str) or not url.strip():
        return jsonify({"success": False, "error": "Missing url"}), 400

    ok, payload = _scrape_with_selenium(url.strip())
    if ok:
        return jsonify({"success": True, "markdown": payload})
    return jsonify({"success": False, "error": payload}), 200


@app.get("/healthz")
def healthz():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.getenv("PORT", "8080")))
