import requests
import json

from db import rawTaskCollection, processedTaskCollection, semiProcessedTasksCollection

def generateFromOllama(model: str, prompt: str, host: str = "http://localhost:11434"):
    url = f"{host}/api/generate"
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }

    response = requests.post(url, json=payload, stream=False)
    response.raise_for_status()

    data = response.json()
    model_output = data.get("response", "")

    try:
        responseJson = json.loads(model_output)
        print(f"response json: {responseJson}")
        return responseJson
    except Exception as e:
        print("Failed with error:", e)

def getUnmanagedTasks():
    for doc in rawTaskCollection.find({"managed": False}):
        print(doc["path"])
        print(doc["description"])
        print(getPrompt(doc["path"], doc["description"]))
    return rawTaskCollection.find({"managed": False})

def getPrompt(path, description):
    prompt = f"""
You are a precise skill extraction assistant.

Tasks are organized in a hierarchy. You will be given:
1. The location of a task in the hierarchy.
2. A natural-language description of that task.

Your goal:
- Identify all key skills or technologies directly mentioned in the task description.
- Also include any closely related skills that are clearly implied or necessary to perform the task.
- Do not invent unrelated skills.

Return the result as a single JSON object with this exact structure:
{{
    "skills": ["skill1", "skill2", "skill3", ...],
    "message": "Optional clarification if needed, otherwise an empty string."
}}
Rules:
- Output only one JSON object.
- Do not include explanations, introductions, markdown formatting, or extra text.
- The JSON must be valid and machine-readable.
- Only include a value for "message" if clarification is truly needed, or details are missing; otherwise, it should be an empty string.

Task path:
"{path}"

Task:
"{description}"

Return only the JSON object.
"""
    return prompt

def processTasks():
    processedTasks = []
    try:    
        for task in getUnmanagedTasks():
            prompt = getPrompt(task["path"], task["description"])
            response = generateFromOllama(
                model="mistral:latest",
                prompt=prompt
            )
            response['task_id'] = task['_id']
            response['path'] = task['path']
            response['description'] = task['description']
            processedTasks.append(response)
        return processedTasks
    except Exception as e:
        print(f"Error processing tasks: {e}")
    
def validateProcessedTasks(processedTasks):
    for processedTask in processedTasks:
        if 'message' in processedTask and processedTask['message'].strip() != "":
            print("Clarification needed:", processedTask['message'])
            semiProcessedTasksCollection.insert_one(processedTask)
        else:
            print("Processed task")
            processedTaskCollection.insert_one(processedTask)
        rawTaskCollection.update_one(
            {"_id": processedTask['task_id']},
            {"$set": {"managed": True}}
        )

if __name__ == "__main__":
    processedTasks = processTasks()
    validateProcessedTasks(processedTasks)