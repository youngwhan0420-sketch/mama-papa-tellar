from fastapi import Header, HTTPException, Depends
import os
from pathlib import Path
from dotenv import load_dotenv

# 환경 설정
load_dotenv(Path(__file__).parent.parent.parent / '.env')

HANDSHAKE_KEY = os.getenv("APP_ACCESS_HANDSHAKE_KEY")

# 검증 함수: 이 함수가 우리 서비스의 '성문지기' 역할을 합니다.
async def verify_handshake_key(x_handshake_key: str = Header(None)):
    # 헤더 명칭은 'X-Handshake-Key'로 정의합니다.
    if x_handshake_key is None or x_handshake_key != HANDSHAKE_KEY:
        # 키가 없거나 다르면 아이들의 안전을 위해 진입을 막습니다.
        raise HTTPException(
            status_code=403, 
            detail="동화 나라의 열쇠가 맞지 않아요! 올바른 암호를 사용해주세요."
        )
    return x_handshake_key