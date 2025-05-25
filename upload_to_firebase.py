import firebase_admin
from firebase_admin import credentials, db
import json
import logging
from datetime import datetime
import os

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('firebase_upload.log', encoding='utf-8', mode='w'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class FirebaseUploader:
    def __init__(self, cred_path='serviceAccountKey.json', json_file='linkedin_applications.json'):
        self.cred_path = cred_path
        self.json_file = json_file
        self.db = None
        
    def initialize_firebase(self):
        """Initialize Firebase connection."""
        try:
            cred = credentials.Certificate(self.cred_path)
            firebase_admin.initialize_app(cred, {
                'databaseURL': 'https://linked-scrapper-44d7e-default-rtdb.firebaseio.com/'
            })
            self.db = db.reference('/')
            logger.info("Successfully initialized Firebase connection")
            return True
        except Exception as e:
            logger.error(f"Error initializing Firebase: {str(e)}")
            return False

    def load_applications(self):
        """Load applications from JSON file."""
        try:
            if not os.path.exists(self.json_file):
                logger.error(f"JSON file not found: {self.json_file}")
                return None
                
            with open(self.json_file, 'r', encoding='utf-8') as f:
                applications = json.load(f)
            logger.info(f"Successfully loaded {len(applications)} applications from JSON")
            return applications
        except Exception as e:
            logger.error(f"Error loading applications from JSON: {str(e)}")
            return None

    def upload_applications(self):
        """Upload applications to Firebase."""
        if not self.initialize_firebase():
            return

        applications = self.load_applications()
        if not applications:
            return

        try:
            # Create a reference to the 'applications' node
            applications_ref = self.db.child('applications')
            
            # Create a timestamp for this upload batch
            upload_timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            
            # Group applications by company
            companies = {}
            for app in applications:
                company_name = app['company_name']
                if company_name not in companies:
                    companies[company_name] = []
                companies[company_name].append(app)

            # Upload data organized by company
            for company_name, company_apps in companies.items():
                # Create a safe key for Firebase (remove special characters)
                safe_company_key = ''.join(c for c in company_name if c.isalnum() or c in ['-', '_']).lower()
                
                # Upload applications for this company
                company_ref = applications_ref.child(safe_company_key)
                for app in company_apps:
                    # Create a unique key for each application based on date
                    app_date = datetime.strptime(app['email_date'], '%Y-%m-%d %H:%M:%S')
                    app_key = app_date.strftime('%Y%m%d_%H%M%S')
                    
                    # Add upload metadata
                    app['upload_batch'] = upload_timestamp
                    
                    # Upload the application
                    company_ref.child(app_key).set(app)
                    logger.info(f"Uploaded application for {company_name} from {app['email_date']}")

            # Update the global last_update timestamp
            self.db.child('last_update').set(datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            logger.info(f"Successfully uploaded all applications to Firebase")
            
        except Exception as e:
            logger.error(f"Error uploading to Firebase: {str(e)}")

def main():
    logger.info("=== Starting Firebase Upload ===")
    uploader = FirebaseUploader()
    uploader.upload_applications()
    logger.info("=== Firebase Upload Completed ===")

if __name__ == '__main__':
    main() 