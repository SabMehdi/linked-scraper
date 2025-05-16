import time
import json
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup

# --- CONFIG ---
LINKEDIN_URL = 'https://www.linkedin.com/my-items/saved-jobs/?cardType=APPLIED'

# --- SETUP SELENIUM ---
def get_driver():
    options = Options()
    options.add_argument('--start-maximized')
    # Uncomment below for headless mode
    # options.add_argument('--headless')
    return webdriver.Chrome(options=options)

def get_direct_text(element):
    # Get only the direct text of the element, not from its children
    if element is None:
        return None
    return ''.join(t for t in element.find_all(string=True, recursive=False)).strip()

def main():
    driver = get_driver()
    driver.get(LINKEDIN_URL)
    print("Please log in to LinkedIn in the opened browser window.")
    input("Press Enter after you have logged in and the jobs page is fully loaded...")
    time.sleep(2)
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    jobs = []
    for li in soup.select('ul[role="list"] > li'):
        job = {}
        # Get the job title from the specific span class
        title_span = li.select_one('span.mNiKOkGLXopRwvUjiHRjxdaEKEMEvBflk')
        job['title'] = title_span.get_text(strip=True) if title_span else None
        # Get the job link from the a tag inside the span
        title_link = title_span.find('a', attrs={'data-test-app-aware-link': True}) if title_span else None
        job['link'] = title_link['href'] if title_link else None
        company = li.select_one('.OxRVYBPaMbQwEfslyYadmBWjwaQuFvi')
        job['company'] = company.get_text(strip=True) if company else None
        location = li.select_one('.xIrTcpbeEHJpnjhTmlNxNrOBpJwtvTjpecBg')
        job['location'] = location.get_text(strip=True) if location else None
        status = li.select_one('.reusable-search-simple-insight__text--small')
        job['status'] = status.get_text(strip=True) if status else None
        logo = li.select_one('img.ivm-view-attr__img--centered')
        job['logo'] = logo['src'] if logo else None
        jobs.append(job)
    driver.quit()
    print(json.dumps(jobs, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main() 