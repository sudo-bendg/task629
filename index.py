from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import pymongo
from bson import ObjectId
import os

from db import rawTaskCollection, semiProcessedTasksCollection, processedTaskCollection, closeDB

app = FastAPI()

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

class TaskRequest(BaseModel):
    path: str
    description: str

class AddressClarificationRequest(BaseModel):
    updatedSkills: list[str] = []

@app.get("/")
def hello(request: Request):
    return templates.TemplateResponse("submit.html", {"request": request})

@app.get("/tasks")
def viewTasks(request: Request):
    return templates.TemplateResponse("tasks.html", {"request": request})

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
        print(f"Error creating task: {e}")
        return {"error": str(e)}
    
@app.get("/tasks/processed")
def getProcessedTasks():
    try:
        tasks = list(processedTaskCollection.find({}))
        return [{
            "id": str(task["_id"]),
            "path": task["path"],
            "description": task["description"],
            "skills": task.get("skills", [])
        } for task in tasks]
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}

@app.get("/tasks/semiProcessed")
def getSemiProcessedTasks():
    try:
        tasks = list(semiProcessedTasksCollection.find({"userHasAddressedClarification": False}))
        return [
            {
                "id": str(task["_id"]),
                "path": task["path"],
                "description": task["description"],
                "skills": task.get("skills", []),
                "message": task.get("message", "")
            } for task in tasks]
    except pymongo.errors.PyMongoError as e:
        return {"error": str(e)}
    
@app.get("/tasks/unprocessed")
def getUnprocessedTasks():
    try:
        tasks = list(rawTaskCollection.find({"managed": False}))
        return [{
            "id": str(task["_id"]),
            "path": task["path"],
            "description": task["description"]
        } for task in tasks]
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