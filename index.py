from fastapi import FastAPI
from pydantic import BaseModel
import pymongo

from db import rawTaskCollection, closeDB

app = FastAPI()

class TaskRequest(BaseModel):
    path: str
    description: str

@app.get("/")
def hello():
    return {"message": "Hello, World!"}

@app.post("/task")
def create_task(task: TaskRequest):
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