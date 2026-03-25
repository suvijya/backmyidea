import sys
import json
import io
import logging
import scrapy
from scrapy.crawler import CrawlerProcess
from bs4 import BeautifulSoup

# Force UTF-8 encoding for standard output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

class ContentSpider(scrapy.Spider):
    name = 'content_spider'
    
    def __init__(self, url=None, *args, **kwargs):
        super(ContentSpider, self).__init__(*args, **kwargs)
        self.start_urls = [url] if url else []
        self.result = {"success": False, "url": url, "markdown": ""}

    def parse(self, response):
        try:
            # We use BeautifulSoup to easily strip tags and get clean text
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Remove irrelevant sections
            for element in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
                element.decompose()
                
            text = soup.get_text(separator='\n', strip=True)
            
            self.result["success"] = True
            self.result["markdown"] = text
        except Exception as e:
            self.result["success"] = False
            self.result["error"] = str(e)
            
    def closed(self, reason):
        print("---CRAWL_RESULT_START---")
        print(json.dumps(self.result))
        print("---CRAWL_RESULT_END---")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("---CRAWL_RESULT_START---")
        print(json.dumps({"success": False, "error": "No URL provided"}))
        print("---CRAWL_RESULT_END---")
        sys.exit(1)
        
    url = sys.argv[1]
    
    process = CrawlerProcess(settings={
        "LOG_LEVEL": logging.ERROR,
        "USER_AGENT": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "ROBOTSTXT_OBEY": False,
        "DOWNLOAD_TIMEOUT": 15,
        "RETRY_TIMES": 1
    })
    
    process.crawl(ContentSpider, url=url)
    process.start()
