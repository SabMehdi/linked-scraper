import os
import imaplib
import email
from email.header import decode_header, make_header
from datetime import datetime
import base64
from bs4 import BeautifulSoup
import logging
import json
import re
from geopy.geocoders import Nominatim
from geopy.exc import GeocoderTimedOut
import time

# Configuration
EMAIL_ADDRESS = "saber.almehdi@gmail.com"
APP_PASSWORD = "phuu corj dkcl kobm"
MAX_DATE = "2025-03-01"
OUTPUT_DIR = 'linkedin_emails'
SEARCH_SUBJECT = "Al Mehdi, votre candidature a été envoyée à"
JSON_FILE = 'linkedin_applications.json'
LOCATION_CACHE_FILE = 'location_cache.json'

# Load location cache if it exists
if os.path.exists(LOCATION_CACHE_FILE):
    with open(LOCATION_CACHE_FILE, 'r', encoding='utf-8') as f:
        location_cache = json.load(f)
else:
    location_cache = {}

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('linkedin_emails.log', encoding='utf-8', mode='w'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def decode_email_subject(subject):
    """Properly decode email subject that might be encoded."""
    try:
        decoded_header = decode_header(subject)
        header = make_header(decoded_header)
        decoded_subject = str(header)
        logger.debug(f"Decoded subject from: {subject} to: {decoded_subject}")
        return decoded_subject
    except Exception as e:
        logger.error(f"Error decoding subject: {str(e)}")
        return subject

def extract_application_date(text):
    """Extract date from 'Candidature envoyée le' text."""
    match = re.search(r'Candidature envoyée le (\d{1,2} \w+ \d{4})', text)
    if match:
        return match.group(1)
    return None

def clean_text(text):
    """Clean extracted text by removing extra whitespace and newlines."""
    if text:
        return ' '.join(text.strip().split())
    return None

def geocode_location(location, geolocator):
    """Geocode a location string to get latitude and longitude."""
    if not location:
        return None, None
    
    # Check cache first
    if location in location_cache:
        coords = location_cache[location]
        logger.debug(f"Found location in cache: {location} -> {coords}")
        return coords['lat'], coords['lng']
    
    try:
        logger.debug(f"Geocoding location: {location}")
        geo = geolocator.geocode(location, timeout=10)
        if geo:
            lat, lng = geo.latitude, geo.longitude
            # Save to cache
            location_cache[location] = {'lat': lat, 'lng': lng}
            # Save cache to file
            with open(LOCATION_CACHE_FILE, 'w', encoding='utf-8') as f:
                json.dump(location_cache, f, ensure_ascii=False, indent=2)
            logger.info(f"Successfully geocoded: {location} -> {lat}, {lng}")
            return lat, lng
    except GeocoderTimedOut:
        logger.warning(f"Geocoding timed out for {location}, retrying...")
        time.sleep(1)
        return geocode_location(location, geolocator)
    except Exception as e:
        logger.error(f"Error geocoding location {location}: {str(e)}")
    
    return None, None

class GmailFetcher:
    def __init__(self, email_address, app_password, output_dir=OUTPUT_DIR):
        self.email_address = email_address
        self.app_password = app_password
        self.mail = None
        self.output_dir = output_dir
        self.applications = self.load_existing_applications()
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"Initialized GmailFetcher for {email_address}")
        logger.info(f"Output directory: {output_dir}")

    def load_existing_applications(self):
        """Load existing applications from JSON file if it exists."""
        try:
            if os.path.exists(JSON_FILE):
                with open(JSON_FILE, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logger.error(f"Error loading existing applications: {str(e)}")
            return []

    def save_applications(self):
        """Save applications to JSON file."""
        try:
            with open(JSON_FILE, 'w', encoding='utf-8') as f:
                json.dump(self.applications, f, ensure_ascii=False, indent=2)
            logger.info(f"Successfully saved applications to {JSON_FILE}")
        except Exception as e:
            logger.error(f"Error saving applications: {str(e)}")

    def connect(self):
        """Connect to Gmail using IMAP."""
        try:
            logger.info("Connecting to Gmail...")
            self.mail = imaplib.IMAP4_SSL('imap.gmail.com')
            self.mail.login(self.email_address, self.app_password)
            logger.info("Successfully connected to Gmail")
            return True
        except Exception as e:
            logger.error(f"Error connecting to Gmail: {str(e)}")
            return False

    def disconnect(self):
        """Safely close the connection."""
        if self.mail:
            try:
                self.mail.close()
                self.mail.logout()
                logger.info("Disconnected from Gmail")
            except:
                logger.warning("Error during Gmail disconnect")

    def extract_job_info(self, html_content, email_date):
        """Extract job information from HTML content."""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Initialize job info dictionary
            job_info = {
                'company_name': None,
                'job_title': None,
                'location': None,
                'work_type': None,
                'application_date': None,
                'email_date': email_date.strftime('%Y-%m-%d %H:%M:%S'),
                'company_logo': None
            }
            
            # Find the application date
            date_p = soup.find('p', string=lambda text: text and 'Candidature envoyée le' in text)
            if date_p:
                job_info['application_date'] = extract_application_date(date_p.text)

            # Find the job title in the anchor tag with text-color-brand class
            job_title_tag = soup.find('a', class_=lambda x: x and 'text-color-brand' in x)
            if job_title_tag:
                job_info['job_title'] = clean_text(job_title_tag.get_text())
                logger.debug(f"Found job title: {job_info['job_title']}")

            # Find company logo
            logo_img = soup.find('img', class_=lambda x: x and 'company-logo' in x.lower() or 'rounded-[2px]' in x)
            if logo_img and 'src' in logo_img.attrs:
                logo_url = logo_img['src']
                # Keep the URL as is, including query parameters
                job_info['company_logo'] = logo_url
                logger.debug(f"Found company logo: {job_info['company_logo']}")

            # Get all text elements, excluding common UI elements
            text_elements = []
            for element in soup.find_all(string=True):
                text = clean_text(element.strip())
                if text and text not in ['Se désabonner', 'LinkedIn', '·']:
                    text_elements.append(text)

            # Find the line containing work type and location
            work_type_patterns = ['(Hybride)', '(Sur site)', '(À distance)']
            location_line = None
            for text in text_elements:
                if any(pattern in text for pattern in work_type_patterns):
                    location_line = text
                    break

            if location_line:
                # Extract work type (everything in parentheses)
                work_type_match = re.search(r'\((.*?)\)', location_line)
                if work_type_match:
                    job_info['work_type'] = work_type_match.group(1)
                
                # Find the full line containing company and location (contains '·')
                company_location_line = None
                for text in text_elements:
                    if '·' in text and any(pattern in text for pattern in work_type_patterns):
                        company_location_line = text
                        break

                if company_location_line:
                    # Split by '·' to separate company and location
                    parts = company_location_line.split('·')
                    if len(parts) >= 2:
                        job_info['company_name'] = parts[0].strip()
                        # Get location part and remove the work type
                        location_part = parts[1].strip()
                        location_part = location_part.split('(')[0].strip()
                        job_info['location'] = location_part
                        logger.debug(f"Extracted location: {job_info['location']}")
                        logger.debug(f"Extracted company: {job_info['company_name']}")

            logger.debug(f"Extracted job info: {job_info}")
            return job_info

        except Exception as e:
            logger.error(f"Error extracting job info: {str(e)}")
            return None

    def process_email(self, email_message, date_str):
        """Process email and extract job information."""
        try:
            html_content = ""
            if email_message.is_multipart():
                for part in email_message.walk():
                    if part.get_content_type() == "text/html":
                        html_content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        break
            else:
                if email_message.get_content_type() == "text/html":
                    html_content = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')

            if not html_content:
                logger.warning("No HTML content found in email")
                return None

            email_date = email.utils.parsedate_to_datetime(date_str)
            job_info = self.extract_job_info(html_content, email_date)
            
            if job_info:
                # Add geocoding for the location
                geolocator = Nominatim(user_agent="linkedin-email-geocoder")
                lat, lng = geocode_location(job_info.get('location'), geolocator)
                job_info['lat'] = lat
                job_info['lng'] = lng
                
                if all(v is not None for v in [job_info['company_name'], job_info['job_title'], job_info['location']]):
                    self.applications.append(job_info)
                    logger.info(f"Successfully extracted and geocoded job info for {job_info['company_name']}")
                    return True

            logger.warning("Incomplete job information extracted")
            return None

        except Exception as e:
            logger.error(f"Error processing email: {str(e)}")
            return None

    def fetch_linkedin_emails(self, max_date=None):
        """Fetch LinkedIn job application emails and extract job information."""
        if not self.connect():
            return

        try:
            self.mail.select('INBOX')
            logger.info("Selected INBOX")

            search_criteria = '(FROM "jobs-noreply@linkedin.com")'
            if max_date:
                try:
                    date_obj = datetime.strptime(max_date, '%Y-%m-%d')
                    search_criteria = f'(SINCE "{date_obj.strftime("%d-%b-%Y")}" {search_criteria})'
                    logger.info(f"Searching emails since {date_obj.strftime('%d-%b-%Y')}")
                except ValueError:
                    logger.error("Invalid date format. Please use YYYY-MM-DD format.")
                    return

            logger.info(f"Searching with criteria: {search_criteria}")
            _, message_numbers = self.mail.search(None, search_criteria)
            
            if not message_numbers[0]:
                logger.warning("No messages found matching the search criteria")
                return

            message_list = message_numbers[0].split()
            total_messages = len(message_list)
            logger.info(f"Found {total_messages} messages from LinkedIn")

            processed_count = 0
            saved_count = 0
            skipped_count = 0
            
            for i, num in enumerate(message_list, 1):
                logger.info(f"Processing message {i}/{total_messages}")
                _, msg_data = self.mail.fetch(num, '(RFC822)')
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                subject = email_message.get("subject", "")
                decoded_subject = decode_email_subject(subject)
                
                if not decoded_subject.startswith(SEARCH_SUBJECT):
                    logger.debug(f"Skipping email - subject doesn't match: {decoded_subject[:50]}...")
                    skipped_count += 1
                    continue

                if self.process_email(email_message, email_message['date']):
                    saved_count += 1
                processed_count += 1
                
                if i % 5 == 0:
                    logger.info(f"Progress: {i}/{total_messages} emails processed")

            # Save all applications to JSON file
            self.save_applications()

            logger.info("\n=== Processing Summary ===")
            logger.info(f"Total messages found: {total_messages}")
            logger.info(f"Messages processed: {processed_count}")
            logger.info(f"Applications saved: {saved_count}")
            logger.info(f"Messages skipped: {skipped_count}")
            logger.info("========================\n")

        except Exception as e:
            logger.error(f"An error occurred: {str(e)}")
            logger.exception("Detailed error information:")
        finally:
            self.disconnect()

def main():
    logger.info("=== Starting LinkedIn Email Fetcher ===")
    logger.info(f"Email: {EMAIL_ADDRESS}")
    logger.info(f"Max Date: {MAX_DATE}")
    logger.info(f"Output Directory: {OUTPUT_DIR}")
    logger.info(f"Search Subject: {SEARCH_SUBJECT}")
    
    fetcher = GmailFetcher(EMAIL_ADDRESS, APP_PASSWORD)
    fetcher.fetch_linkedin_emails(MAX_DATE)
    
    logger.info("=== LinkedIn Email Fetcher Completed ===")

if __name__ == '__main__':
    main()
