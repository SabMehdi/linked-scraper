# LinkedIn Applied Jobs Scraper

This Python app scrapes your applied jobs from the LinkedIn "Applied Jobs" page using Selenium and BeautifulSoup.

## Features
- Extracts job title, company, location, application status, job link, and company logo.
- Outputs the results as JSON in the console.

## Requirements
- Python 3.7+
- Google Chrome browser
- [ChromeDriver](https://sites.google.com/chromium.org/driver/) (should match your Chrome version)

## Installation
1. **Clone this repository or download the files.**
2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
3. **Download ChromeDriver:**
   - Download the version matching your Chrome browser from [here](https://sites.google.com/chromium.org/driver/).
   - Place the `chromedriver` executable in your PATH or in the project directory.

## Usage
1. **Important:** Before running the script, set the `MAX_JOBS` variable in `scrape_linkedin_applied_jobs.py` to control how many jobs (and thus how many pages) will be scraped.
2. Run the script:
   ```bash
   python scrape_linkedin_applied_jobs.py
   ```
2. A Chrome window will open. Log in to LinkedIn and navigate to your "Applied Jobs" page if not already there.
3. Once the page is fully loaded, return to the terminal and press Enter.
4. The script will scrape the jobs and print them as JSON.

## Notes
- This script is for personal use only. Automated scraping of LinkedIn is against their terms of service.
- You may need to update the selectors if LinkedIn changes their page layout. 