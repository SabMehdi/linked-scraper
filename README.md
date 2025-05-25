# LinkedIn Job Application Email Scraper

This script fetches emails from Gmail that are sent by LinkedIn's jobs-noreply@linkedin.com with subjects starting with "Al Mehdi, votre candidature a été envoyée à" and saves their HTML content to separate files.

## Setup

1. First, install the required dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Generate a Gmail App Password:
   - Go to your Google Account settings
   - Navigate to Security
   - Under "2-Step Verification", click on "App passwords"
   - Select "Mail" and your device type
   - Click "Generate"
   - Save the 16-character password that appears

## Usage

Run the script:
```bash
python inspect_linkedin_emails.py
```

The script will prompt you for:
1. Your Gmail address
2. Your Gmail app password (the 16-character password you generated)
3. Maximum age of emails to fetch (in YYYY-MM-DD format)
   - Press Enter to fetch all emails without a date limit
   - Or enter a date like "2024-01-01" to only fetch emails after that date

The script will:
- Create a 'linkedin_emails' directory if it doesn't exist
- Save each email's HTML content in a separate .htm file
- Name files using the format: `YYYYMMDD_HHMMSS_Subject.htm`

## Notes

- Make sure 2-Step Verification is enabled on your Google Account to generate app passwords
- The app password is a 16-character code that gives the script access to your Gmail account
- Never share your app password with anyone
- You can revoke app passwords at any time from your Google Account settings 