# from pprint import pprint
from database import db_visualizations,db_kpis
# all_docs = db_visualizations.find()
# for doc in all_docs:
#     pprint(doc)

# Get all documents
all_docs = db_kpis.find()

# Print each document
for doc in all_docs:
    print(doc)

# Delete all documents in the collection
# result = db_visualizations.delete_many({})

# print(f"Deleted {result.deleted_count} documents from db_visualizations")