import json
import firebase_admin
from firebase_admin import credentials, db

# Path to your Firebase service account key
cred = credentials.Certificate('serviceAccountKey.json')

# Your database URL (find it in Firebase Console > Realtime Database > Data)
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://linked-scrapper-44d7e-default-rtdb.firebaseio.com/'
})

# Load and upload location_cache.json
with open('location_cache.json', 'r', encoding='utf-8') as f:
    location_cache = json.load(f)
db.reference('location_cache').set(location_cache)

# Load and upload applied_jobs.json
with open('applied_jobs.json', 'r', encoding='utf-8') as f:
    applied_jobs = json.load(f)
db.reference('applied_jobs').set(applied_jobs)

print('Data uploaded to Firebase Realtime Database.')