import os
import sys
import subprocess
import json

# [1. 라이브러리 자동 설치 구현]
# 실행 시 'google-genai'가 없으면 자동으로 설치합니다.
try:
    from google import genai
    from google.genai import types
    import uvicorn
    from fastapi import FastAPI, HTTPException
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel
    print("✅ 모든 라이브러리가 정상적으로 로드되었습니다.")
except ImportError as e:
    print(f"⚠️ 필수 라이브러리가 없습니다: {e}")
    print("📦 라이브러리 자동 설치를 시작합니다...")
    # pip install 명령어를 파이썬 내부에서 실행
    subprocess.check_call([sys.executable, "-m", "pip", "install", "google-genai", "fastapi", "uvicorn"])
    print("🎉 설치 완료! 프로그램을 다시 시작합니다...")

    # 설치 후 라이브러리를 다시 불러오기 위해 재실행하거나, 
    # Replit 환경에서는 여기서 스크립트를 종료하고 다시 Run을 누르게 유도하는 것이 안전합니다.
    sys.exit()

# ------------------------------------------------------------------

# [2. API Key 대화형 입력 구현]
# 환경변수에 키가 없으면 터미널에서 입력을 받습니다.
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

if not GOOGLE_API_KEY:
    print("\n" + "="*50)
    print("🚨 GOOGLE_API_KEY가 환경변수에 설정되지 않았습니다.")
    print("Google AI Studio에서 발급받은 키를 입력해주세요.")
    print("="*50)
    # 사용자로부터 직접 입력 받기
    GOOGLE_API_KEY = input("🔑 API Key 입력: ").strip()

    # 입력받은 키를 현재 프로세스의 환경변수로 설정
    os.environ["GOOGLE_API_KEY"] = GOOGLE_API_KEY

# Gemini 클라이언트 초기화 (새로운 SDK 사용)
client = genai.Client(api_key=GOOGLE_API_KEY)

# ------------------------------------------------------------------

# FastAPI 앱 초기화
app = FastAPI(
    title="오늘의 1분 지식 AI 서버",
    description="Gemini 2.0 Flash를 활용한 지식 생성 API",
    version="1.0.0"
)

# [3. CORS 설정 (필수)]
# 프론트엔드(HTML/JS)에서 오는 요청을 허용하기 위해 필수입니다.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 모든 도메인 허용
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 데이터 수신을 위한 Pydantic 모델
class TopicRequest(BaseModel):
    topic: str
    angle: str = "흥미로운 사실 위주"
    temperature: float = 0.9
    topP: float = 0.95

# ------------------------------------------------------------------

# [4. & 5. Gemini 연결 및 엔드포인트 구현]
@app.post("/register") 
async def generate_knowledge(request: TopicRequest):
    print(f"\n📩 요청 수신: {request.topic} ({request.angle})")

    # [수정 1] 시스템 프롬프트 강화: 단일 객체 반환을 강력하게 요구
    system_instruction = """
    너는 세상에서 가장 잡학다식하고 유머러스한 '지식 큐레이터'야.
    사용자가 주제를 주면, 아주 흥미로운 1분 지식 콘텐츠를 생성해야 해.

    [필수 규칙]
    1. 반드시 오직 '하나의' 지식만 생성할 것. (여러 개 금지)
    2. JSON Array([])를 사용하지 말고, 단일 JSON Object({})로 반환할 것.
    3. 다음 형식을 정확히 지킬 것:
    {
        "title": "제목 (이모지 포함)",
        "content": "내용 본문 (3~4문장)",
        "summary": "한 줄 요약"
    }
    """

    user_prompt = f"""
    주제: {request.topic}
    관점: {request.angle}

    위 주제에 대해 선택된 관점으로 사람들이 잘 모르는 흥미로운 사실을 딱 하나만 알려줘.
    """

    try:
        response = client.models.generate_content(
            model='gemini-2.0-flash', 
            contents=user_prompt,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                # 같은 주제가 걸리더라도 다른 답변을 유도할 수 있도록 temp와 top_p 값을 랜덤으로 생성해서 넘겼습니다.
                temperature=request.temperature,
                top_p=request.topP,
                response_mime_type='application/json' 
            )
        )

        raw_text = response.text
        print(f"🤖 AI 응답 완료: {raw_text[:100]}...") # 로그 확인

        # JSON 파싱
        parsed_data = json.loads(raw_text)

        # [수정 2] 방어 로직: 리스트([])로 오면 껍질 벗기기
        # AI가 실수로 [{...}, {...}] 이렇게 주면 첫 번째만 가져옵니다.
        if isinstance(parsed_data, list):
            print("⚠️ 경고: AI가 리스트를 반환했습니다. 첫 번째 항목만 추출합니다.")
            if len(parsed_data) > 0:
                parsed_data = parsed_data[0] # 첫 번째 것만 선택
            else:
                # 빈 리스트가 온 경우 에러 처리
                raise ValueError("AI가 빈 리스트를 반환했습니다.")

        return parsed_data

    except Exception as e:
        print(f"🔥 에러 발생: {str(e)}")
        return {
            "title": "앗! AI가 생각에 잠겼어요 😵",
            "content": f"일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.\n(에러 내용: {str(e)})",
            "summary": "서버 통신 오류 발생"
        }
# ------------------------------------------------------------------

# 서버 실행 (Replit 호환)
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)