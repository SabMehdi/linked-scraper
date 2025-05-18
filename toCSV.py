import json
import csv

# Load your JSON data
with open('applied_jobs.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Open a CSV file for writing
with open('applied_jobs.csv', 'w', newline='', encoding='utf-8') as f:
    # Create a CSV writer
    writer = csv.DictWriter(f, fieldnames=data[0].keys())
    writer.writeheader()
    writer.writerows(data)