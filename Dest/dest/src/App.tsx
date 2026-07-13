import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "./App.css";

type FormatType = "min" | "duration" | "time";

type UserInfo = {
  name: string;
  age: "10대" | "20대" | "30대" | "40대" | "50대" | "60대 이상";
  gender: "남" | "여";
};

type Answer = { score: number; value: number; label: string };

type QMeta = {
  id: number;
  text: string;
  format: FormatType;
  invert: boolean;
  shortName: string;
  band: [number, number, number];
};

const VIRTUAL_CSV_DATA: Record<string, number[]> = {
  "10대 남": [87, 486, 1146, 36, 354, 441, 216, 33, 679, 1413],
  "10대 여": [88, 472, 1148, 36, 253, 449, 170, 43, 683, 1424],
  "20대 남": [109, 450, 1146, 35, 422, 301, 244, 54, 663, 1479],
  "20대 여": [114, 449, 1150, 35, 397, 305, 192, 80, 687, 1470],
  "30대 남": [123, 439, 1149, 36, 444, 253, 183, 61, 649, 1449],
  "30대 여": [103, 445, 1145, 35, 406, 175, 170, 129, 670, 1426],
  "40대 남": [124, 438, 1151, 36, 457, 149, 176, 61, 648, 1421],
  "40대 여": [103, 440, 1149, 35, 380, 164, 177, 166, 657, 1416],
  "50대 남": [122, 426, 1145, 35, 434, 142, 217, 72, 654, 1406],
  "50대 여": [98, 423, 1141, 34, 379, 144, 203, 169, 667, 1404],
  "60대 이상 남": [110, 435, 1137, 34, 373, 171, 294, 89, 679, 1369],
  "60대 이상 여": [95, 428, 1131, 33, 315, 175, 244, 192, 676, 1372],
};

const Q_META: QMeta[] = [
  { id: 1, text: "Q1. 평일 하루 이동시간이 총 몇 분 걸리나요?", format: "min", invert: false, shortName: "이동 시간", band: [50, 30, 10] },
  { id: 2, text: "Q2. 평일 실제 수면시간은 하루 몇 시간인가요?", format: "duration", invert: true, shortName: "수면 시간", band: [150, 90, 30] },
  { id: 3, text: "Q3. 평일 저녁식사는 보통 몇 시에 시작하나요?", format: "time", invert: false, shortName: "저녁식사 시각", band: [100, 60, 20] },
  { id: 4, text: "Q4. 평일 점심식사에 보통 몇 분을 사용하나요?", format: "min", invert: true, shortName: "점심식사 시간", band: [25, 15, 5] },
  { id: 5, text: "Q5. 평일 하루에 일, 근무를 얼마나 하나요?", format: "duration", invert: false, shortName: "근무 시간", band: [150, 90, 30] },
  { id: 6, text: "Q6. 평일 하루에 공부를 얼마나 하나요?", format: "duration", invert: false, shortName: "공부 시간", band: [50, 30, 10] },
  { id: 7, text: "Q7. 평일 하루에 문화 및 여가활동을 얼마나 하나요?", format: "duration", invert: true, shortName: "여가 활동", band: [100, 60, 20] },
  { id: 8, text: "Q8. 평일 하루에 가정관리(집안일)을 얼마나 하나요?", format: "min", invert: false, shortName: "집안일 시간", band: [25, 15, 5] },
  { id: 9, text: "Q9. 평일 하루에 개인유지시간(수면 및 휴식시간)을 얼마나 가지나요?", format: "duration", invert: true, shortName: "개인유지 시간", band: [150, 90, 30] },
  { id: 10, text: "Q10. 평일 취침시각은 언제인가요?", format: "time", invert: false, shortName: "취침 시각", band: [150, 90, 30] },
];

const RESULTS_DATA = [
  { min: -30, max: -11, title: "말랑말랑 생식빵", desc: "에너지가 100% 충전된 아주 여유로운 생활 패턴입니다.", tone: "fresh" as const },
  { min: -10, max: -6, title: "폭신폭신 촉촉한 식빵", desc: "또래보다 여유가 있는 편입니다. 지금의 좋은 리듬을 유지해 보세요.", tone: "soft" as const },
  { min: -5, max: 5, title: "노릇노릇 맛있는 식빵", desc: "또래 평균과 비슷한 균형형 생활 패턴입니다.", tone: "normal" as const },
  { min: 6, max: 10, title: "아슬아슬 토스트 아웃", desc: "번아웃 신호가 슬슬 보입니다. 수면·휴식 조절이 필요해요.", tone: "dry" as const },
  { min: 11, max: 30, title: "새까만 번아웃 식빵", desc: "피로 누적이 큰 상태입니다. 당장 회복 루틴이 필요합니다.", tone: "burnt" as const },
];

function getResult(score: number) {
  return RESULTS_DATA.find((r) => score >= r.min && score <= r.max) ?? RESULTS_DATA[2];
}

function formatVal(val: number, formatType: FormatType) {
  const v = Math.max(0, Math.floor(val));
  const h = Math.floor(v / 60);
  const m = v % 60;

  if (formatType === "time") {
    let hour = h % 24;
    return `${hour}시 ${m > 0 ? `${m}분` : ""}`;
  }

  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function buildOptions(meta: QMeta, avg: number) {
  const [A, B, C] = meta.band;
  const levels = [-3, -2, -1, 0, 1, 2, 3];
  const deltaByLevel: Record<number, number> = { [-3]: -A, [-2]: -B, [-1]: -C, 0: 0, 1: C, 2: B, 3: A };

  return levels.map((lvl) => {
    let label = "";
    if (lvl === -3) label = `${formatVal(avg - A, meta.format)} 미만`;
    else if (lvl === -2) label = `${formatVal(avg - A, meta.format)} ~ ${formatVal(avg - B, meta.format)}`;
    else if (lvl === -1) label = `${formatVal(avg - B, meta.format)} ~ ${formatVal(avg - C, meta.format)}`;
    else if (lvl === 0) label = `${formatVal(avg - C, meta.format)} ~ ${formatVal(avg + C, meta.format)}`;
    else if (lvl === 1) label = `${formatVal(avg + C, meta.format)} ~ ${formatVal(avg + B, meta.format)}`;
    else if (lvl === 2) label = `${formatVal(avg + B, meta.format)} ~ ${formatVal(avg + A, meta.format)}`;
    else label = `${formatVal(avg + A, meta.format)} 이상`;

    const score = meta.invert ? -lvl : lvl;
    const value = avg + deltaByLevel[lvl];
    return { score, value, label };
  });
}

// ---------------- 이미지 캐릭터 컴포넌트 ----------------
function BotongCharacter({ qId, small }: { qId?: number; small?: boolean }) {
  const getCharacterImage = (id?: number) => {
    switch (id) {
      case 1: return "/images/char_8.png"; // Q1: 이동
      case 2: return "/images/char_5.png"; // Q2: 수면
      case 3: return "/images/char_6.png"; // Q3: 저녁식사
      case 4: return "/images/char_6.png"; // Q4: 점심식사
      case 5: return "/images/char_2.png"; // Q5: 근무
      case 6: return "/images/char_3.png"; // Q6: 공부
      case 7: return "/images/char_7.png"; // Q7: 여가활동
      case 8: return "/images/char_4.png"; // Q8: 집안일
      case 9: return "/images/char_9.png"; // Q9: 개인유지
      case 10: return "/images/char_5.png"; // Q10: 취침시각
      default: return "/images/main.png"; // 인트로 기본 모습
    }
  };

  return (
    <div className={`botong-img-wrapper ${small ? "small-char" : ""}`}>
      <img src={getCharacterImage(qId)} alt="캐릭터 일러스트" className="botong-image" />
    </div>
  );
}

const TOAST_IMAGES: Record<"fresh" | "soft" | "normal" | "dry" | "burnt", string> = {
  fresh: "/images/bread1.PNG",
  soft: "/images/bread2.PNG",
  normal: "/images/bread3.PNG",
  dry: "/images/bread4.PNG",
  burnt: "/images/bread5.PNG",
};

function ToastImage({ tone }: { tone: "fresh" | "soft" | "normal" | "dry" | "burnt" }) {
  return (
    <div className="toast-img-wrapper">
      <img src={TOAST_IMAGES[tone]} alt="결과 토스트 일러스트" className="toast-image" />
    </div>
  );
}

// ---------------- 화면 컴포넌트 ----------------
function IntroScreen({ onStart }: { onStart: (info: UserInfo) => void }) {
  const [info, setInfo] = useState<UserInfo>({ name: "", age: "20대", gender: "여" });

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="screen-wrapper">
      <div className="panel intro-panel">
        <div className="panel-inner">
          <div className="badge">국가데이터 기반 국민 참여형 테스트</div>
          <BotongCharacter />
          <h1 className="title">번아웃 식빵 테스트</h1>
          <p className="subtitle">나의 생활 패턴을 또래 평균과 비교해봐요.</p>

          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!info.name.trim()) return;
              onStart(info);
            }}
          >
            <label>
              이름(닉네임)
              <input value={info.name} onChange={(e) => setInfo({ ...info, name: e.target.value })} required />
            </label>

            <div className="row">
              <label>
                연령대
                <select value={info.age} onChange={(e) => setInfo({ ...info, age: e.target.value as UserInfo["age"] })}>
                  {["10대", "20대", "30대", "40대", "50대", "60대 이상"].map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>
              <label>
                성별
                <select value={info.gender} onChange={(e) => setInfo({ ...info, gender: e.target.value as UserInfo["gender"] })}>
                  <option value="남">남성</option>
                  <option value="여">여성</option>
                </select>
              </label>
            </div>

            <button className="primary">내 일상 비교하러 가기</button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}

function QuestionScreen({ step, total, meta, avg, onAnswer }: any) {
  const options = useMemo(() => buildOptions(meta, avg), [meta, avg]);
  const progress = (step / total) * 100;

  return (
    <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="screen-wrapper">
      <div className="panel question-panel">
        <div className="panel-inner">
          
          <div className="progress-wrap">
            <div className="progress-head">
              <span className="q-badge">Q{step} / {total}</span>
              <span>번아웃 체크 중...</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>

          <div className="cookie-card">
            <BotongCharacter qId={meta.id} small />
            <h2>{meta.text}</h2>
            
            <div className="options">
              {options.map((opt: any, idx: number) => (
                <button key={idx} onClick={() => onAnswer({ score: opt.score, value: opt.value, label: opt.label })} className="option-btn">
                  <span className="num">{idx + 1}</span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
}

function DeviationItem({ meta, myVal, avgVal }: any) {
  const diff = myVal - avgVal;
  const isRight = diff > 0;
  const absDiff = Math.abs(diff);
  
  const width = Math.min((absDiff / 180) * 50, 50); 
  const color = isRight ? "#F76C6C" : "#48C0B5";

  return (
    <div className="dev-item">
      <div className="dev-q-text">{meta.text}</div>
      
      <div className="dev-bar-container">
        <div className="dev-center-line"></div>
        <div className="dev-center-label">평균</div>
        
        <div 
          className="dev-bar-fill" 
          style={{ 
            width: `${width}%`, 
            backgroundColor: color,
            left: isRight ? '50%' : `calc(50% - ${width}%)`
          }} 
        />
      </div>

      <div className="dev-result-text" style={{ color: color }}>
        {diff === 0 ? "평균과 완벽히 일치해요!" : `${isRight ? '+' : '-'} ${formatVal(absDiff, 'min')} (${isRight ? '평균보다 많음' : '평균보다 적음'})`}
      </div>
    </div>
  );
}

function ResultScreen({ userInfo, answers, groupAvgs, onRestart }: any) {
  const [showAll, setShowAll] = useState(false);
  const [shareLabel, setShareLabel] = useState("결과 공유하기");
  const totalScore = answers.reduce((acc: any, cur: any) => acc + cur.score, 0);
  const result = getResult(totalScore);

  const summary = useMemo(() => {
      if (totalScore >= 11) return "전반적으로 또래보다 활동량이 과도하거나 휴식이 턱없이 부족한 상태입니다. 신체적, 정신적 방전이 오기 전에 반드시 온전한 휴식 시간을 확보해야 합니다.";
      if (totalScore >= 6) return "또래 평균보다 조금 더 무리하고 계시네요. 번아웃이 찾아오기 전, 일상의 속도를 조금 늦추고 수면과 여가 시간을 챙겨보세요.";
      if (totalScore >= -5) return "또래와 비슷한 균형 잡힌 일상을 보내고 계시네요. 규칙적인 생활 패턴 속에 본인만의 힐링 루틴을 더해보면 어떨까요?";
      if (totalScore >= -10) return "또래 평균보다 여유로운 생활을 하고 계시네요. 에너지가 잘 채워져 있으니, 이 안정적인 리듬을 바탕으로 활기찬 일상을 즐겨보세요.";
      return "에너지 관리가 아주 훌륭합니다! 넉넉한 휴식을 통해 100% 충전된 에너지를 바탕으로 일상의 작은 즐거움들을 마음껏 만끽해 보세요.";
    }, [totalScore]);

  const detailedAnswers = useMemo(() => {
    return answers.map((ans: any, i: number) => {
      const diff = ans.value - groupAvgs[i];
      return {
        meta: Q_META[i],
        myVal: ans.value,
        avgVal: groupAvgs[i],
        absDiff: Math.abs(diff),
      };
    }).sort((a: any, b: any) => b.absDiff - a.absDiff);
  }, [answers, groupAvgs]);

  const displayedAnswers = showAll ? detailedAnswers : detailedAnswers.slice(0, 3);
  
  const handleShare = async () => {
      const scoreText = totalScore > 0 ? `+${totalScore}` : `${totalScore}`;
      const shareUrl = window.location.href;
  
      const shareText = [
        `🍞 ${userInfo.name}님의 번아웃 테스트 결과 🍞`,
        `"${result.title}"`,
        ``,
        `🔥 번아웃 지수: ${scoreText}점`,
        `💬 ${result.desc}`,
        ``,
        `나의 일상은 어떤 식빵일까? 🫣`,
        `지금 바로 또래 평균과 비교해보기 👇`,
        `${shareUrl}`
      ].join("\n");
  
      const showCopied = () => {
        setShareLabel("복사되었습니다! ✨");
        setTimeout(() => setShareLabel("결과 공유하기"), 2000);
      };
  
      try {
        if (navigator.share) {
          await navigator.share({
            title: "번아웃 식빵 테스트 결과",
            text: shareText,
          });
          return;
        }
  
        await navigator.clipboard.writeText(shareText);
        showCopied();
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
  
        try {
          await navigator.clipboard.writeText(shareText);
          showCopied();
        } catch {
          setShareLabel("공유에 실패했어요 😢");
          setTimeout(() => setShareLabel("결과 공유하기"), 2000);
        }
      }
    };

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="screen-wrapper">
      <div className="panel result-panel">
        <h2 className="result-title">{userInfo.name}님의 일상 분석</h2>
        <div className="score-chip">종합 번아웃 지수: {totalScore > 0 ? `+${totalScore}` : totalScore}점</div>

        <div className="toast-wrap"><ToastImage tone={result.tone} /></div>
        <h3 className="result-name">“{result.title}”</h3>
        <p className="result-desc">{result.desc}</p>
        
        <div className="summary-box">
          <h4>💡 주요 요약</h4>
          <p>{summary}</p>
        </div>

        <div className="dev-title-wrap">
          <h4>📊 {userInfo.age} {userInfo.gender}성 평균과의 가장 큰 차이</h4>
        </div>
        
        <div className="deviation-chart">
          {displayedAnswers.map((data: any) => (
            <DeviationItem 
              key={data.meta.id} 
              meta={data.meta} 
              myVal={data.myVal} 
              avgVal={data.avgVal} 
            />
          ))}
        </div>
        
        {!showAll && (
          <button className="outline-btn" onClick={() => setShowAll(true)}>
            전체 10개 항목 비교 보기 ▽
          </button>
        )}

        <div className="result-actions">
          <button className="primary" onClick={handleShare}>{shareLabel}</button>
          <button className="secondary" onClick={onRestart}>새 반죽으로 다시 시작하기 ↺</button>
        </div>

        <div className="promo-footer">
          <p className="reference-text">
            본 테스트는{' '}
            <a 
              href="https://kosis.kr/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="footer-link"
              title="kosis 홈페이지 이동"
            >
              <b>국가통계포털(KOSIS) 「2024 생활시간조사」</b>
            </a>
            <br />
            {' '}결과를 기반으로 제작되었습니다.
          </p>
          
          <a 
            href="https://mods.go.kr/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="promo-slogan-box"
            title="국가데이터처 홈페이지로 이동"
          >
            <span className="slogan-text">데이터로 통하는 대한민국</span>
            <span className="slogan-brand">국민과 함께하는 <b>국가데이터처</b></span>
          </a>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState<UserInfo>({ name: "", age: "20대", gender: "여" });
  const [groupAvgs, setGroupAvgs] = useState<number[]>([]);
  const [answers, setAnswers] = useState<Answer[]>([]);

  const start = (info: UserInfo) => {
    setUserInfo(info);
    setGroupAvgs(VIRTUAL_CSV_DATA[`${info.age} ${info.gender}`] ?? VIRTUAL_CSV_DATA["20대 여"]);
    setAnswers([]);
    setStep(1);
  };

  const answer = (a: Answer) => {
    setAnswers((prev) => [...prev, a]);
    setStep((prev) => prev + 1);
  };

  return (
    <div className="app-bg">
      <div className="container">
        <AnimatePresence mode="wait">
          {step === 0 && <IntroScreen onStart={start} />}
          {step > 0 && step <= Q_META.length && (
            <QuestionScreen
              step={step}
              total={Q_META.length}
              meta={Q_META[step - 1]}
              avg={groupAvgs[step - 1]}
              onAnswer={answer}
            />
          )}
          {step > Q_META.length && (
            <ResultScreen userInfo={userInfo} answers={answers} groupAvgs={groupAvgs} onRestart={() => setStep(0)} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
