"""
Tencent Hunyuan3D-WorldClaw: API Server & Generator Service
Provides REST API endpoints for agentic 3D world planning, asset generation, and digital twin compilation.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, Optional
from layout_agent import WorldClawLayoutAgent

app = FastAPI(
    title="Tencent Hunyuan3D-WorldClaw Engine API",
    description="Agentic 3D Open-World Generation Pipeline for Serpukhov Digital Twin",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

layout_agent = WorldClawLayoutAgent()

class GenerateWorldRequest(BaseModel):
    prompt: str
    city_name: Optional[str] = "Серпухов"
    quality: Optional[str] = "high"

class GenerateAssetRequest(BaseModel):
    asset_name: str
    category: str
    prompt: str

@app.get("/")
def read_root():
    return {
        "engine": "Tencent Hunyuan3D-WorldClaw",
        "status": "online",
        "supported_models": ["Hunyuan3D-2", "WorldClaw-Agent-1.0"],
        "active_world": "Серпухов (SKD BYD & Кибердеревня)"
    }

@app.post("/api/worldclaw/generate")
def generate_world(req: GenerateWorldRequest):
    try:
        world_spec = layout_agent.plan_world_layout(req.prompt, city_name=req.city_name)
        return {
            "success": True,
            "engine": "Tencent Hunyuan3D-WorldClaw",
            "world_spec": world_spec
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/worldclaw/serpukhov")
def get_serpukhov_world():
    from serpukhov_world_builder import build_serpukhov_world
    spec = build_serpukhov_world()
    return spec

import urllib.request
import json
import os

class NvidiaDirectorRequest(BaseModel):
    prompt: str

@app.post("/api/worldclaw/nvidia-director")
def nvidia_director(req: NvidiaDirectorRequest):
    try:
        api_key = os.environ.get("NVIDIA_API_KEY", "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")
        url = "https://integrate.api.nvidia.com/v1/chat/completions"
        
        system_prompt = """You are the AI Director of a 3D Cyberpunk City (Serpukhov).
You have two modes of operation:

MODE 1: ENVIRONMENT CONTROL (Default)
If the user asks to change the time, weather, or spawn vehicles/drones, you MUST respond ONLY with valid JSON.
Output format schema:
{
  "timeOfDay": "night" | "day" | "sunset" | "dawn" | "none",
  "weather": "rain" | "clear" | "none",
  "spawn": [ { "type": "drone" | "car" | "truck", "count": 1, "color": "yellow" | "red" | "blue" } ]
}
Example: "сделай ночь и пусти дождь" -> {"timeOfDay":"night","weather":"rain","spawn":[]}

MODE 2: GOD MODE (Code Generation)
If the user asks you to build, create, or code a new 3D object, building, or structure (like a pyramid, cube, factory, etc.), you MUST respond ONLY with JavaScript code.
Write valid Three.js code that creates the requested object and adds it to the variable `scene`. 
Use primitive geometries (BoxGeometry, CylinderGeometry) and MeshStandardMaterial.
Always wrap the code in ```javascript markdown blocks.
Example: 
```javascript
const box = new THREE.Mesh(new THREE.BoxGeometry(5,5,5), new THREE.MeshStandardMaterial({color: 0xff0000}));
box.position.y = 2.5;
scene.add(box);
```
"""

        payload = {
            "model": "meta/llama-3.1-70b-instruct",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.prompt}
            ],
            "temperature": 0.2,
            "max_tokens": 4096
        }
        
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        req_obj = urllib.request.Request(url, data=json.dumps(payload).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req_obj) as response:
            result = json.loads(response.read())
            reply = result["choices"][0]["message"]["content"].strip()
            
            # Basic cleanup in case LLM outputs markdown
            if reply.startswith("```json"): reply = reply[7:]
            if reply.startswith("```"): reply = reply[3:]
            if reply.endswith("```"): reply = reply[:-3]
            
            try:
                command_json = json.loads(reply)
            except json.JSONDecodeError:
                # Fallback: The LLM didn't return JSON. Let's just return a command to log the text.
                command_json = {
                    "timeOfDay": "none",
                    "weather": "none",
                    "spawn": [],
                    "message": reply
                }

            return {
                "success": True,
                "command": command_json
            }
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/worldclaw/blender/status")
def get_blender_status():
    from blender_bridge import get_blender_binary
    bin_path = get_blender_binary()
    return {
        "installed": bin_path is not None,
        "binary_path": bin_path,
        "engine": "Blender 4.2 LTS Headless Pipeline"
    }

@app.post("/api/worldclaw/blender/build-all")
def trigger_blender_build_all():
    from blender_bridge import build_all_masterplan_assets
    try:
        res = build_all_masterplan_assets()
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class BlenderCodeRequest(BaseModel):
    python_code: str
    output_name: Optional[str] = "ai_generated_asset.glb"

@app.post("/api/worldclaw/blender/execute-bpy")
def execute_bpy_code(req: BlenderCodeRequest):
    from blender_bridge import execute_custom_bpy_code
    try:
        res = execute_custom_bpy_code(req.python_code, req.output_name)
        return res
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
