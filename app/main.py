from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import json
import os

app = FastAPI()

# 프론트엔드(React)에서 접근할 수 있도록 CORS 설정 허용
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 로컬 개발 시에는 전체 허용, 배포 시에는 React 주소만 허용
    allow_methods=["*"],
    allow_headers=["*"],
)

# metadata.json 파일 경로 설정
# 현재 main.py 위치 기준으로 data/metadata.json을 찾습니다.
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
METADATA_PATH = os.path.join(BASE_DIR, "data", "metadata.json")

@app.get("/api/stories")
async def get_stories():
    try:
        # 1. metadata.json 파일을 읽습니다.
        if not os.path.exists(METADATA_PATH):
            raise HTTPException(status_code=404, detail="메타데이터 파일을 찾을 수 없어요.")
            
        with open(METADATA_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        # 2. 읽어온 JSON 데이터를 프론트로 반환합니다.
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)