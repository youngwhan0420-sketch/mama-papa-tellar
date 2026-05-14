from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from app.api import stories, voice_qwen, stream_JMS, quizzes
from app.api.handshake import verify_handshake_key

app = FastAPI(title="마마/파파 텔러 API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 분리된 라우터들을 등록합니다. 각 라우터에 핸드셰이크 키 검증을 위한 의존성을 추가합니다.
app.include_router(stories.router, dependencies=[Depends(verify_handshake_key)])
app.include_router(voice_qwen.router, dependencies=[Depends(verify_handshake_key)])
app.include_router(stream_JMS.router, dependencies=[Depends(verify_handshake_key)])
app.include_router(quizzes.router, dependencies=[Depends(verify_handshake_key)])

@app.get("/")
async def root():
    return {"message": "아이들을 위한 따뜻한 이야기 세상, 마마/파파 텔러입니다."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)