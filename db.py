from pymongo import MongoClient
from config import dbConnectionString

uri = dbConnectionString
client = MongoClient(uri)
db = client["hearthDB"]
rawTaskCollection = db["rawTasks"]
processedTaskCollection = db["processedTasks"]
semiProcessedTasksCollection = db["semiProcessedTasks"]

def closeDB():
    client.close()