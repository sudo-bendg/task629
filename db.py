from pymongo import MongoClient
from config import dbConnectionString

uri = dbConnectionString
client = MongoClient(uri)
db = client["hearthDB"]
rawTaskCollection = db["rawTasks"]

def closeDB():
    client.close()