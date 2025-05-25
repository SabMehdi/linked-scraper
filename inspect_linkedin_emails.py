import os
import imaplib
import email
from email.header import decode_header, make_header
from datetime import datetime
import base64
from bs4 import BeautifulSoup
import logging

# Configuration
EMAIL_ADDRESS = "saber.almehdi@gmail.com"
APP_PASSWORD = "phuu corj dkcl kobm"
MAX_DATE = "2025-05-20"
OUTPUT_DIR = 'linkedin_emails'
SEARCH_SUBJECT = "Al Mehdi, votre candidature a été envoyée à"

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,  # Changed to DEBUG level for more detailed logs
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('linkedin_emails.log', encoding='utf-8', mode='w'),  # 'w' mode to start fresh
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

def decode_email_subject(subject):
    """Properly decode email subject that might be encoded."""
    try:
        # Decode the email header
        decoded_header = decode_header(subject)
        # Convert to a header object which handles all the decoding
        header = make_header(decoded_header)
        # Convert to string
        decoded_subject = str(header)
        logger.debug(f"Decoded subject from: {subject} to: {decoded_subject}")
        return decoded_subject
    except Exception as e:
        logger.error(f"Error decoding subject: {str(e)}")
        return subject

class GmailFetcher:
    def __init__(self, email_address, app_password, output_dir=OUTPUT_DIR):
        self.email_address = email_address
        self.app_password = app_password
        self.mail = None
        self.output_dir = output_dir
        os.makedirs(self.output_dir, exist_ok=True)
        logger.info(f"Initialized GmailFetcher for {email_address}")
        logger.info(f"Output directory: {output_dir}")

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

    def get_html_content(self, email_message):
        """Extract HTML content from email message."""
        try:
            html_content = ""
            if email_message.is_multipart():
                logger.debug("Processing multipart message")
                for part in email_message.walk():
                    content_type = part.get_content_type()
                    logger.debug(f"Found part with content type: {content_type}")
                    if content_type == "text/html":
                        html_content = part.get_payload(decode=True).decode('utf-8', errors='ignore')
                        logger.debug("Found HTML content in multipart message")
                        break
            else:
                logger.debug("Processing single part message")
                if email_message.get_content_type() == "text/html":
                    html_content = email_message.get_payload(decode=True).decode('utf-8', errors='ignore')
                    logger.debug("Found HTML content in single part message")
            
            if not html_content:
                logger.warning("No HTML content found in message")
            else:
                logger.debug(f"HTML content length: {len(html_content)} characters")
            return html_content

        except Exception as e:
            logger.error(f"Error extracting HTML content: {str(e)}")
            return ""

    def save_email(self, email_message, date_str):
        """Save email HTML content to a file."""
        try:
            # Get subject first for logging
            subject = email_message.get("subject", "")
            decoded_subject = decode_email_subject(subject)
            logger.debug(f"Processing email with subject: {decoded_subject}")

            html_content = self.get_html_content(email_message)
            if not html_content:
                logger.warning(f"No HTML content found in email with subject: {decoded_subject}")
                return None

            # Parse the date
            date = email.utils.parsedate_to_datetime(date_str)
            logger.debug(f"Email date: {date}")

            # Create safe filename
            safe_subject = "".join(x for x in decoded_subject[:50] if x.isalnum() or x in (' ', '-', '_'))
            filename = f"{date.strftime('%Y%m%d_%H%M%S')}_{safe_subject}.htm"
            filepath = os.path.join(self.output_dir, filename)

            # Save the HTML content
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(html_content)

            logger.info(f"Successfully saved email: {filename}")
            return filepath

        except Exception as e:
            logger.error(f"Error saving email: {str(e)}")
            return None

    def fetch_linkedin_emails(self, max_date=None):
        """Fetch LinkedIn job application emails and save their HTML bodies."""
        if not self.connect():
            return

        try:
            # Select the inbox
            self.mail.select('INBOX')
            logger.info("Selected INBOX")

            # Use simpler search criteria to avoid encoding issues
            search_criteria = '(FROM "jobs-noreply@linkedin.com")'
            if max_date:
                try:
                    date_obj = datetime.strptime(max_date, '%Y-%m-%d')
                    search_criteria = f'(SINCE "{date_obj.strftime("%d-%b-%Y")}" {search_criteria})'
                    logger.info(f"Searching emails since {date_obj.strftime('%d-%b-%Y')}")
                except ValueError:
                    logger.error("Invalid date format. Please use YYYY-MM-DD format.")
                    return

            # Search for matching emails
            logger.info(f"Searching with criteria: {search_criteria}")
            _, message_numbers = self.mail.search(None, search_criteria)
            
            if not message_numbers[0]:
                logger.warning("No messages found matching the search criteria")
                return

            message_list = message_numbers[0].split()
            total_messages = len(message_list)
            logger.info(f"Found {total_messages} messages from LinkedIn")

            # Process each message and filter by subject
            processed_count = 0
            saved_count = 0
            skipped_count = 0
            
            for i, num in enumerate(message_list, 1):
                logger.info(f"Processing message {i}/{total_messages}")
                _, msg_data = self.mail.fetch(num, '(RFC822)')
                email_body = msg_data[0][1]
                email_message = email.message_from_bytes(email_body)
                
                # Check subject
                subject = email_message.get("subject", "")
                decoded_subject = decode_email_subject(subject)
                logger.debug(f"Checking subject: {decoded_subject}")
                
                if not decoded_subject.startswith(SEARCH_SUBJECT):
                    logger.debug(f"Skipping email - subject doesn't match: {decoded_subject[:50]}...")
                    skipped_count += 1
                    continue

                date_str = email_message['date']
                filepath = self.save_email(email_message, date_str)
                
                if filepath:
                    saved_count += 1
                    logger.info(f"Successfully saved email {i} to: {filepath}")
                else:
                    logger.warning(f"Failed to save email {i}")
                processed_count += 1
                
                if i % 5 == 0:  # Log progress every 5 emails
                    logger.info(f"Progress: {i}/{total_messages} emails processed")

            logger.info("\n=== Processing Summary ===")
            logger.info(f"Total messages found: {total_messages}")
            logger.info(f"Messages processed: {processed_count}")
            logger.info(f"Messages saved: {saved_count}")
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
