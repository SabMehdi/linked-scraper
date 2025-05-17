import time
import json
import random
from selenium import webdriver
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from bs4 import BeautifulSoup
import re
from datetime import datetime, timedelta
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut

# --- CONFIG ---
BASE_URL = 'https://www.linkedin.com/my-items/saved-jobs/?cardType=APPLIED'
MAX_JOBS = 10  # Set your max jobs here
OUTPUT_FILE = 'applied_jobs.json'

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

def split_status(status_text):
    # Try to split status into action and time using regex
    # Example: 'Candidature déposée il y a 23 h' -> ('Candidature déposée', 'il y a 23 h')
    if not status_text:
        return None, None
    match = re.match(r'(.+?)( il y a .+)', status_text)
    if match:
        action = match.group(1).strip()
        rel_time = match.group(2).strip()
        # Convert relative time to absolute date
        abs_date = None
        now = datetime.now()
        # Handle days, hours, minutes, weeks, months, years
        if 'il y a' in rel_time:
            rel = rel_time.replace('il y a', '').strip()
            if 'j' in rel:  # days
                days = int(re.search(r'(\d+)\s*j', rel).group(1))
                abs_date = (now - timedelta(days=days)).strftime('%Y-%m-%d')
            elif 'h' in rel:  # hours
                hours = int(re.search(r'(\d+)\s*h', rel).group(1))
                abs_date = (now - timedelta(hours=hours)).strftime('%Y-%m-%d')
            elif 'min' in rel:  # minutes
                mins = int(re.search(r'(\d+)\s*min', rel).group(1))
                abs_date = (now - timedelta(minutes=mins)).strftime('%Y-%m-%d')
            elif 'sem' in rel:  # weeks
                weeks = int(re.search(r'(\d+)\s*sem', rel).group(1))
                abs_date = (now - timedelta(weeks=weeks)).strftime('%Y-%m-%d')
            elif 'mois' in rel:  # months (approximate as 30 days)
                months = int(re.search(r'(\d+)\s*mois', rel).group(1))
                abs_date = (now - timedelta(days=months*30)).strftime('%Y-%m-%d')
            elif 'an' in rel:  # years (approximate as 365 days)
                years = int(re.search(r'(\d+)\s*an', rel).group(1))
                abs_date = (now - timedelta(days=years*365)).strftime('%Y-%m-%d')
        return action, abs_date or rel_time
    # Try other patterns, e.g., 'CV téléchargé il y a 5 h', 'Candidature vue il y a 1 j'
    match = re.match(r'(.+?)( il y a .+)', status_text)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    # If not matched, return the whole as status, None as time
    return status_text.strip(), None

def geocode_location(location, geolocator):
    if not location:
        return None, None
    try:
        geo = geolocator.geocode(location, timeout=10)
        if geo:
            return geo.latitude, geo.longitude
    except GeocoderTimedOut:
        time.sleep(1)
        return geocode_location(location, geolocator)
    except Exception:
        pass
    return None, None

def scrape_jobs_from_page(driver, geolocator=None):
    soup = BeautifulSoup(driver.page_source, 'html.parser')
    jobs = []
    for li in soup.select('ul[role="list"] > li'):
        job = {}
        title_span = li.select_one('span.mNiKOkGLXopRwvUjiHRjxdaEKEMEvBflk')
        job['title'] = title_span.get_text(strip=True) if title_span else None
        title_link = title_span.find('a', attrs={'data-test-app-aware-link': True}) if title_span else None
        job['link'] = title_link['href'] if title_link else None
        company = li.select_one('.OxRVYBPaMbQwEfslyYadmBWjwaQuFvi')
        job['company'] = company.get_text(strip=True) if company else None
        location = li.select_one('.xIrTcpbeEHJpnjhTmlNxNrOBpJwtvTjpecBg')
        loc_text = location.get_text(strip=True) if location else None
        # Split location and work style (e.g., 'Paris (Hybride)', 'Lyon (Sur site)', 'Marseille (À distance)')
        if loc_text and '(' in loc_text and ')' in loc_text:
            loc_main, loc_style = re.match(r'^(.*?)\s*\((.*?)\)\s*$', loc_text).groups()
            job['location'] = loc_main.strip()
            job['work_style'] = loc_style.strip()
        else:
            job['location'] = loc_text
            job['work_style'] = None
        # Geocode location if geolocator is provided
        if geolocator:
            lat, lng = geocode_location(job['location'], geolocator)
            job['lat'] = lat
            job['lng'] = lng
        status = li.select_one('span.qhJKIVkJwEOmqPDdgPZCvumvunZvpzvAgZM.reusable-search-simple-insight__text--small')
        status_text = status.get_text(strip=True) if status else None
        job['status'], job['status_time'] = split_status(status_text)
        logo = li.select_one('img.ivm-view-attr__img--centered')
        job['logo'] = logo['src'] if logo else None
        jobs.append(job)
    return jobs

def main():
    driver = get_driver()
    all_jobs = []
    page = 0
    print("Please log in to LinkedIn in the opened browser window.")
    url = BASE_URL
    print(f"[URL] Requesting: {url}")
    driver.get(url)
    input("Press Enter after you have logged in and the jobs page is fully loaded...")
    while len(all_jobs) < MAX_JOBS:
        if page > 0:
            url = f"{BASE_URL}&start={page*10}"
            print(f"[URL] Requesting: {url}")
            driver.get(url)
            sleep_time = random.uniform(2.5, 6.0)
            print(f"[INFO] Sleeping for {sleep_time:.2f} seconds before scraping page {page+1}...")
            time.sleep(sleep_time)
        jobs = scrape_jobs_from_page(driver)
        if not jobs:
            print(f"[INFO] No more jobs found on page {page+1}. Stopping.")
            break
        for job in jobs:
            print(f"[LOG] {job['title']} | {job['status_time']}")
        all_jobs.extend(jobs)
        if len(jobs) < 10:
            # Last page
            break
        page += 1
        if len(all_jobs) >= MAX_JOBS:
            break
    driver.quit()
    all_jobs = all_jobs[:MAX_JOBS]
    # Geocode all jobs after scraping
    geolocator = Nominatim(user_agent="linkedin-applied-jobs-geocoder")
    for job in all_jobs:
        lat, lng = geocode_location(job.get('location'), geolocator)
        job['lat'] = lat
        job['lng'] = lng
        print(f"Geocoded: {job.get('location')} -> {lat}, {lng}")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(all_jobs, f, ensure_ascii=False, indent=2)
    print(f"[DONE] Scraped {len(all_jobs)} jobs. Saved to {OUTPUT_FILE}.")

if __name__ == '__main__':
    main() 