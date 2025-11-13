from fastapi import FastAPI
from pydantic import BaseModel
import pymongo
from bson import ObjectId

from db import rawTaskCollection, semiProcessedTasksCollection, processedTaskCollection, closeDB

app = FastAPI()

class TaskRequest(BaseModel):
    path: str
    description: str

class AddressClarificationRequest(BaseModel):
    updatedSkills: list[str] = []

@app.get("/")
def hello():
    return {"message": "Hello, World!"}

@app.post("/task")
def create_task(task: TaskRequest):
    print("Received task creation request:", task)
    try:
        taskDetails = {
            "path": task.path,
            "description": task.description,
            "managed": False
        }
        rawTaskCollection.insert_one(taskDetails)
        return {
            "message": "Task created successfully",
            "task": {
                "path": task.path,
                "description": task.description
        }
    }
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}

@app.get("/tasks/semiProcessed")
def getSemiProcessedTasks():
    try:
        tasks = list(semiProcessedTasksCollection.find({"userHasAddressedClarification": False}))
        return [str(task["_id"]) for task in tasks]
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}

@app.get("/tasks/semiProcessed/{task_id}")
def getSemiProcessedTaskDetails(task_id: str):
    try:
        task = semiProcessedTasksCollection.find_one({"_id": ObjectId(task_id)})
        if task:
            return {
                "path": task["path"],
                "description": task["description"],
                "skills": task.get("skills", []),
                "message": task.get("message", "")
            }
        else:
            return {"error": "Task not found"}
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}

@app.post("/tasks/semiProcessed/{task_id}/addressClarification")
def addressClarification(task_id: str, request: AddressClarificationRequest):
    try:
        semiProcessedTask = semiProcessedTasksCollection.find_one({"_id": ObjectId(task_id)})
        semiProcessedTasksCollection.update_one(
            {"_id": ObjectId(task_id)},
            {"$set": {"userHasAddressedClarification": True}}
        )
        processedTaskCollection.insert_one({
            "path": semiProcessedTask["path"],
            "description": semiProcessedTask["description"],
            "skills": request.updatedSkills,
            "message": ""
        })
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}