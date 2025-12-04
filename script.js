// [JavaScript 핵심 요구 사항 구현]

// 1. 서버 주소 상수 (백엔드 서버가 생기면 여기에 주소를 넣으세요)
const SERVER_URL = "";

// 2. 랜덤 주제 리스트 (Broad Topics)
const TOPIC_LIST = [
  // 🌏 자연 & 과학
  "우주와 천문학",
  "심해 생태계",
  "희귀한 동물",
  "곤충의 세계",
  "식물의 생존 전략",
  "날씨와 기상 현상",
  "지질학과 화산",
  "인체 신비",
  "뇌과학과 심리",
  "바이러스와 세균",
  "물리학 법칙",
  "화학 반응",
  "환경 문제와 미래",
  "공룡과 고생물",
  "유전공학",
  // 🏛 역사 & 인문
  "고대 문명",
  "세계의 전쟁사",
  "역사 속 미스터리",
  "중세 시대 생활상",
  "조선시대 역사",
  "세계의 신화와 전설",
  "철학적 난제",
  "종교의 기원",
  "고전 문학",
  "언어의 역사",
  "세계의 왕실 문화",
  "실크로드와 무역",
  "발명과 발견의 역사",
  "유명한 위인들의 비화",
  // 🎨 문화 & 예술
  "현대 미술",
  "클래식 음악",
  "재즈와 팝의 역사",
  "영화 제작 비하인드",
  "세계의 건축물",
  "패션의 역사",
  "유명한 명화의 비밀",
  "뮤지컬과 연극",
  "사진 예술",
  "디자인의 역사",
  "세계의 축제",
  "음식의 유래",
  "커피와 차(Tea) 문화",
  "디저트의 역사",
  // 🏙 사회 & 생활
  "세계의 특이한 법",
  "경제와 주식의 기초",
  "마케팅 심리학",
  "범죄 수사 기법",
  "스포츠 규칙의 유래",
  "올림픽 역사",
  "인터넷과 IT 트렌드",
  "미래 기술(AI, 로봇)",
  "교통수단의 발달",
  "세계의 에티켓",
  "속담과 격언의 유래",
  "색채 심리학",
  "여행지 추천 및 정보",
  "취미 생활 추천",
  "MBTI와 성격 유형",
];

// [NEW] 3. 관점(Angle) 리스트: 같은 주제라도 다르게 설명하기 위한 지시사항
const ANGLE_LIST = [
  "충격적인 통계나 숫자를 중심으로 설명해",
  "역사적인 발견 에피소드나 비화를 들려줘",
  "조금 무섭거나 오싹한 사실을 강조해줘",
  "사람들이 잘 모르는 아이러니하거나 웃긴 사실을 찾아줘",
  "미래에 일어날 일이나 예측을 중심으로 설명해줘",
  "과학적인 원리를 아주 쉽고 직관적으로 비유해서 설명해줘",
  "감성적이고 로맨틱한 느낌으로 서술해줘",
];

// 4. UI 헬퍼 함수: 프리셋 버튼 클릭 시 입력창 채우기
function setTopic(topic) {
  document.getElementById("topicInput").value = topic;
}

// 프리셋 버튼에서 주제 가져오기
function setTopicFromButton(buttonIndex) {
  const button = document.getElementById(`preset-btn-${buttonIndex}`);
  const topic = button.dataset.topic;
  if (topic) {
    setTopic(topic);
  }
}

// 페이지 로드 시 프리셋 버튼에 랜덤 주제 할당
function initializePresetButtons() {
  // TOPIC_LIST에서 중복 없이 랜덤으로 2개 선택
  const shuffled = [...TOPIC_LIST].sort(() => Math.random() - 0.5);
  const selectedTopics = shuffled.slice(0, 2);

  // 첫 번째 버튼 업데이트
  const btn1 = document.getElementById("preset-btn-1");
  btn1.dataset.topic = selectedTopics[0];
  btn1.innerHTML = `⚖️ ${selectedTopics[0]}`;

  // 두 번째 버튼 업데이트
  const btn2 = document.getElementById("preset-btn-2");
  btn2.dataset.topic = selectedTopics[1];
  btn2.innerHTML = `🌌 ${selectedTopics[1]}`;
}

// 페이지 로드 시 초기화
document.addEventListener("DOMContentLoaded", initializePresetButtons);

// 5. UI 헬퍼 함수: 완전 랜덤 버튼 클릭 시
function setRandomTopic() {
  const randomIndex = Math.floor(Math.random() * TOPIC_LIST.length);
  document.getElementById("topicInput").value = TOPIC_LIST[randomIndex];
}

// [NEW] 6. AI 파라미터 랜덤 생성 함수 (창의성 & 다양성 확보)
function getRandomConfig() {
  // Temperature (0.7 ~ 1.0): 높을수록 창의적인 답변
  const randomTemp = parseFloat((Math.random() * (1.0 - 0.7) + 0.7).toFixed(2));

  // TopP (0.8 ~ 0.95): 높을수록 다양한 단어 선택
  const randomTopP = parseFloat(
    (Math.random() * (0.95 - 0.8) + 0.8).toFixed(2)
  );

  return { temperature: randomTemp, topP: randomTopP };
}

// 7. 메인 함수: fetchKnowledge
async function fetchKnowledge() {
  const inputField = document.getElementById("topicInput");
  let topic = inputField.value.trim();

  // 입력값이 비어있으면 랜덤 리스트에서 하나 자동 선택
  if (!topic) {
    const randomIndex = Math.floor(Math.random() * TOPIC_LIST.length);
    topic = TOPIC_LIST[randomIndex];
    inputField.value = topic; // 사용자에게 무엇이 선택되었는지 보여줌
  }

  // UI 상태 변경 (로딩 시작)
  const resultArea = document.getElementById("result-area");
  const loader = document.getElementById("loader");

  resultArea.style.display = "none";
  loader.style.display = "block";

  // [NEW] 랜덤 관점 및 파라미터 생성
  const randomAngle = ANGLE_LIST[Math.floor(Math.random() * ANGLE_LIST.length)];
  const aiConfig = getRandomConfig();

  console.log(`[요청 설정] 주제: ${topic}`);
  console.log(`[요청 설정] 관점: ${randomAngle}`);
  console.log(
    `[요청 설정] Temp: ${aiConfig.temperature}, TopP: ${aiConfig.topP}`
  );

  try {
    if (!SERVER_URL) {
      throw new Error("SERVER_URL_MISSING");
    }

    // [API 통신 로직]
    // 서버로 주제뿐만 아니라 관점, temperature, topP를 모두 보냅니다.
    const response = await fetch(SERVER_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: topic,
        angle: randomAngle, // [NEW] 관점 추가
        temperature: aiConfig.temperature, // [NEW] 창의성 점수 추가
        topP: aiConfig.topP, // [NEW] 다양성 점수 추가
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();
    renderResult(data);
  } catch (error) {
    console.error("통신 에러 발생:", error);

    // 에러 메시지 표시
    const errorMessage =
      error.message === "SERVER_URL_MISSING"
        ? "서버 주소가 설정되지 않았습니다. SERVER_URL을 확인해주세요."
        : "서버와 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.";

    const errorData = {
      title: "오류 발생",
      content: errorMessage,
      summary: "요청을 처리할 수 없습니다.",
    };

    renderResult(errorData);
  }
}

// 결과 렌더링 함수
function renderResult(data) {
  const loader = document.getElementById("loader");
  const resultArea = document.getElementById("result-area");

  document.getElementById("res-title").innerText = data.title || "제목 없음";
  document.getElementById("res-content").innerText =
    data.content || "내용이 없습니다.";
  document.getElementById("res-summary").innerText = `📌 한 줄 요약: ${
    data.summary || "요약 없음"
  }`;

  loader.style.display = "none";
  resultArea.style.display = "block";
}
