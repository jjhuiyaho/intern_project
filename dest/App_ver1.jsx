import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/** ---------------------------
 *  임의 평균 데이터 (연령·성별)
 * ----------------------------*/
const VIRTUAL_CSV_DATA = {
  "10대 남": [60, 450, 1110, 50, 60, 360, 150, 10, 660, 1410],
  "10대 여": [60, 450, 1110, 50, 60, 360, 150, 20, 660, 1410],
  "20대 남": [90, 410, 1140, 50, 480, 120, 140, 30, 560, 1470],
  "20대 여": [90, 420, 1140, 60, 480, 120, 130, 40, 560, 1470],
  "30대 남": [100, 400, 1170, 50, 540, 60, 100, 40, 540, 1480],
  "30대 여": [100, 410, 1160, 60, 500, 60, 100, 60, 540, 1470],
  "40대 남": [90, 390, 1160, 50, 540, 30, 90, 40, 530, 1460],
  "40대 여": [80, 400, 1150, 60, 480, 30, 90, 120, 540, 1450],
  "50대 남": [80, 390, 1140, 50, 500, 20, 110, 50, 550, 1440],
  "50대 여": [70, 410, 1130, 60, 420, 20, 110, 150, 570, 1430],
  "60대 이상 남": [60, 400, 1110, 50, 300, 10, 180, 60, 600, 1380],
  "60대 이상 여": [50, 420, 1100, 60, 240, 10, 160, 180, 620, 1380],
};

/** ---------------------------------------------
 *  질문 메타: 네가 준 7구간 규칙(절대 차이값) 반영
 *  band: [A, B, C] -> [-A, -B, -C, ±C, +C, +B, +A]
 * ----------------------------------------------*/
const Q_META = [
  { id: 1, text: "Q1. 평일 하루 이동시간이 총 몇 분 걸리나요?", format: "min", invert: false, shortName: "이동 시간", band: [50, 30, 10] },
  { id: 2, text: "Q2. 평일 실제 수면시간은 하루 몇 시간인가요?", format: "duration", invert: true, shortName: "수면 시간", band: [150, 90, 30] },
  { id: 3, text: "Q3. 평일 저녁식사는 보통 몇 시에 시작하나요?", format: "time", invert: false, shortName: "저녁식사 시각", band: [100, 60, 20] },
  { id: 4, text: "Q4. 평일 점심식사에 보통 몇 분을 사용하나요?", format: "min", invert: true, shortName: "점심식사 시간", band: [25, 15, 5] },
  { id: 5, text: "Q5. 평일 하루에 일, 근무를 얼마나 하나요?", format: "duration", invert: false, shortName: "근무 시간", band: [150, 90, 30] },
  { id: 6, text: "Q6. 평일 하루에 공부를 얼마나 하나요?", format: "duration", invert: false, shortName: "공부 시간", band: [50, 30, 10] },
  { id: 7, text: "Q7. 평일 하루에 문화 및 여가활동을 얼마나 하나요?", format: "duration", invert: true, shortName: "여가 활동", band: [100, 60, 20] },
  { id: 8, text: "Q8. 평일 하루에 가정관리(집안일)을 얼마나 하나요?", format: "min", invert: false, shortName: "집안일 시간", band: [25, 15, 5] },
  { id: 9, text: "Q9. 평일 하루에 개인유지시간(수면 및 휴식시간)을 얼마나 가지나요?", format: "duration", invert: true, shortName: "개인유지 시간", band: [150, 90, 30] },
  { id: 10, text: "Q10. 평일 취침시각은 언제인가요?", format: "time", invert: false, shortName: "취침 시각", band: [150, 90, 30] }
];

/** 결과 단계 */
const RESULTS_DATA = [
  { min: -30, max: -11, title: "말랑말랑 생식빵", desc: "에너지가 충분하고 비교적 안정적인 생활 패턴입니다.", tone: "fresh", card: "bg-amber-50 border-amber-200" },
  { min: -10, max: -6, title: "살짝 덜익은 식빵", desc: "아직 여유가 있지만 생활 리듬을 조금 더 점검해보면 좋아요.", tone: "soft", card: "bg-yellow-50 border-yellow-300" },
  { min: -5, max: 5, title: "노릇노릇 맛있는 식빵", desc: "또래 평균과 비슷한 균형형 생활 패턴입니다.", tone: "normal", card: "bg-orange-50 border-orange-300" },
  { min: 6, max: 10, title: "아슬아슬 토스트 아웃", desc: "번아웃 신호가 슬슬 보입니다. 수면·휴식 조절이 필요해요.", tone: "dry", card: "bg-amber-100 border-amber-400" },
  { min: 11, max: 30, title: "새까만 번아웃 식빵", desc: "피로 누적이 큰 상태입니다. 회복 루틴이 꼭 필요합니다.", tone: "burnt", card: "bg-stone-800 border-stone-600 text-stone-100" },
];

const getResult = (score) => RESULTS_DATA.find(r => score >= r.min && score <= r.max) || RESULTS_DATA[2];

/** 값 포맷 */
const formatVal = (val, formatType) => {
  if (formatType === 'time') {
    let v = Math.floor(val);
    while (v < 0) v += 24 * 60;
    while (v >= 24 * 60) v -= 24 * 60;
    const h = Math.floor(v / 60);
    const m = v % 60;
    return `${h}시${m > 0 ? ` ${m}분` : ''}`;
  }
  if (formatType === 'duration') {
    const v = Math.max(0, Math.floor(val));
    const h = Math.floor(v / 60);
    const m = v % 60;
    if (h === 0) return `${m}분`;
    return `${h}시간${m > 0 ? ` ${m}분` : ''}`;
  }
  return `${Math.max(0, Math.floor(val))}분`;
};

/** 7구간 옵션 생성 */
function buildOptions(meta, avg) {
  const [A, B, C] = meta.band;
  // 레벨 -3,-2,-1,0,1,2,3
  const levels = [-3, -2, -1, 0, 1, 2, 3];
  const deltaByLevel = { "-3": -A, "-2": -B, "-1": -C, "0": 0, "1": C, "2": B, "3": A };

  return levels.map((lvl) => {
    let label = '';
    if (lvl === -3) {
      label = `${formatVal(avg - A, meta.format)} 미만`;
    } else if (lvl === -2) {
      label = `${formatVal(avg - A, meta.format)} ~ ${formatVal(avg - B, meta.format)}`;
    } else if (lvl === -1) {
      label = `${formatVal(avg - B, meta.format)} ~ ${formatVal(avg - C, meta.format)}`;
    } else if (lvl === 0) {
      label = `${formatVal(avg - C, meta.format)} ~ ${formatVal(avg + C, meta.format)}`;
    } else if (lvl === 1) {
      label = `${formatVal(avg + C, meta.format)} ~ ${formatVal(avg + B, meta.format)}`;
    } else if (lvl === 2) {
      label = `${formatVal(avg + B, meta.format)} ~ ${formatVal(avg + A, meta.format)}`;
    } else {
      label = `${formatVal(avg + A, meta.format)} 이상`;
    }

    const score = meta.invert ? -lvl : lvl; // invert 문항은 반대로 점수
    const value = avg + deltaByLevel[String(lvl)];
    return { lvl, score, value, label };
  });
}

/** ---------------------------
 *  귀여운 보통씨 CSS 캐릭터
 * ----------------------------*/
function BotongCharacter() {
  return (
    <div className="botong-wrap">
      <div className="botong-hair" />
      <div className="botong-face">
        <span className="eye left" />
        <span className="eye right" />
        <span className="nose" />
        <span className="mouth" />
        <span className="blush left" />
        <span className="blush right" />
      </div>
      <div className="botong-body" />
      <div className="botong-hand" />
    </div>
  );
}

/** ---------------------------
 *  CSS 식빵(결과용)
 * ----------------------------*/
function CssToast({ tone = "normal" }) {
  return (
    <div className={`toast ${tone}`}>
      <div className="toast-inner" />
      <div className="toast-face">
        <span className="t-eye" />
        <span className="t-eye" />
        <span className="t-mouth" />
      </div>
    </div>
  );
}

function IntroScreen({ onStart }) {
  const [info, setInfo] = useState({ name: '', age: '20대', gender: '여' });

  const submit = (e) => {
    e.preventDefault();
    if (!info.name.trim()) return;
    onStart(info);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
      <div className="bg-white/95 rounded-[2rem] p-6 md:p-8 shadow-xl border border-amber-100">
        <div className="inline-flex items-center gap-1.5 bg-[#e6f4f1] text-[#2c7a72] font-bold px-4 py-1.5 rounded-full text-xs md:text-sm mb-5 border border-[#48C0B5]">
          국가데이터처 국민 체감 통계 서비스
        </div>

        <BotongCharacter />

        <h1 className="text-3xl md:text-4xl font-bold text-[#4A2F1D] mt-4 mb-2">번아웃 식빵 테스트</h1>
        <p className="text-[#4A2F1D] opacity-80 mb-6">생활 패턴을 또래 평균과 비교해 번아웃 위험을 확인해보세요.</p>

        <form onSubmit={submit} className="space-y-4 text-left">
          <div>
            <label className="block mb-1.5 text-sm font-bold text-[#4A2F1D]">이름(닉네임)</label>
            <input
              className="w-full p-3.5 rounded-2xl border-2 border-teal-200 focus:border-[#48C0B5] focus:outline-none"
              placeholder="이름을 입력해주세요"
              value={info.name}
              onChange={(e) => setInfo({ ...info, name: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-bold text-[#4A2F1D]">연령대</label>
              <select
                className="w-full p-3.5 rounded-2xl border-2 border-teal-200 focus:border-[#48C0B5] focus:outline-none"
                value={info.age}
                onChange={(e) => setInfo({ ...info, age: e.target.value })}
              >
                {['10대', '20대', '30대', '40대', '50대', '60대 이상'].map(a => <option key={a}>{a}</option>)}
              </select>
            </div>
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-bold text-[#4A2F1D]">성별</label>
              <select
                className="w-full p-3.5 rounded-2xl border-2 border-teal-200 focus:border-[#48C0B5] focus:outline-none"
                value={info.gender}
                onChange={(e) => setInfo({ ...info, gender: e.target.value })}
              >
                <option value="남">남성</option>
                <option value="여">여성</option>
              </select>
            </div>
          </div>

          <button className="w-full mt-4 bg-[#48C0B5] hover:bg-[#3ba399] text-white text-lg font-bold py-4 rounded-2xl">
            테스트 시작하기
          </button>
        </form>
      </div>
    </motion.div>
  );
}

function QuestionScreen({ meta, avg, step, total, onAnswer }) {
  const options = buildOptions(meta, avg);
  const progress = (step / total) * 100;

  return (
    <motion.div key={step} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} className="w-full">
      <div className="mb-4">
        <div className="flex justify-between text-sm font-bold text-[#4A2F1D] mb-2">
          <span className="bg-white/90 px-3 py-1 rounded-full">Q{step}</span>
          <span className="bg-white/90 px-3 py-1 rounded-full">{step} / {total}</span>
        </div>
        <div className="h-3 bg-white/60 rounded-full overflow-hidden border border-black/5">
          <motion.div className="h-full bg-[#48C0B5]" initial={{ width: `${((step - 1) / total) * 100}%` }} animate={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="cracker-card relative w-full p-6 md:p-8 mb-5 shadow-xl">
        <div className="flex flex-col items-center text-center min-h-[250px] justify-center">
          <BotongCharacter />
          <h2 className="text-xl md:text-2xl font-bold leading-relaxed text-[#4A2F1D] bg-white/80 px-4 py-3 rounded-2xl border border-white/70 mt-3">
            {meta.text}
          </h2>
        </div>
      </div>

      <div className="space-y-2.5">
        {options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onAnswer(opt)}
            className="w-full p-4 bg-white/95 hover:bg-teal-50 border-2 border-white hover:border-[#48C0B5] rounded-2xl text-left flex items-center gap-3 shadow"
          >
            <span className="w-8 h-8 rounded-full bg-[#e6f4f1] text-[#2c7a72] flex items-center justify-center text-sm font-bold">{idx + 1}</span>
            <span className="font-bold text-[#4A2F1D]">{opt.label}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}

function ComparisonChart({ answers, groupAvgs, qMeta }) {
  const maxVal = Math.max(...answers.map(a => a.value), ...groupAvgs, 1);
  return (
    <div className="bg-white/95 p-5 rounded-2xl border border-amber-100 shadow-md">
      <h4 className="text-lg font-bold text-center mb-1">10가지 생활시간 상세 비교</h4>
      <p className="text-xs text-center opacity-60 mb-5">나 vs 또래 평균(연령·성별)</p>

      <div className="space-y-4">
        {answers.map((a, i) => {
          const myW = Math.max((a.value / maxVal) * 100, 12);
          const avgW = Math.max((groupAvgs[i] / maxVal) * 100, 12);

          return (
            <div key={i}>
              <div className="text-sm font-bold mb-1.5 text-[#6b4d3d]">Q{i + 1}. {qMeta[i].shortName}</div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 text-right text-xs font-bold opacity-70">나</div>
                  <div className="flex-1 h-5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#F76C6C] rounded-full flex items-center justify-end pr-2" style={{ width: `${myW}%` }}>
                      <span className="text-[10px] text-white font-bold">{formatVal(a.value, qMeta[i].format)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-7 text-right text-xs font-bold opacity-70">평균</div>
                  <div className="flex-1 h-5 bg-black/5 rounded-full overflow-hidden">
                    <div className="h-full bg-[#48C0B5] rounded-full flex items-center justify-end pr-2" style={{ width: `${avgW}%` }}>
                      <span className="text-[10px] text-white font-bold">{formatVal(groupAvgs[i], qMeta[i].format)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ResultScreen({ userInfo, answers, groupAvgs, qMeta, onRestart }) {
  const totalScore = answers.reduce((acc, cur) => acc + cur.score, 0);
  const result = getResult(totalScore);
  const isDark = result.tone === 'burnt';

  const insights = answers.map((ans, idx) => {
    const diff = ans.value - groupAvgs[idx];
    return { name: qMeta[idx].shortName, format: qMeta[idx].format, diffVal: diff, absDiff: Math.abs(diff) };
  }).sort((a, b) => b.absDiff - a.absDiff);

  const top1 = insights[0];
  const top2 = insights[1];

  const diffText = (item) => {
    const d = formatVal(item.absDiff, item.format === 'time' ? 'duration' : item.format);
    if (item.diffVal > 0) return item.format === 'time' ? `평균보다 ${d} 늦습니다.` : `평균보다 ${d} 더 많습니다.`;
    return item.format === 'time' ? `평균보다 ${d} 이릅니다.` : `평균보다 ${d} 더 적습니다.`;
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className={`rounded-[2rem] p-5 md:p-8 border-2 shadow-2xl ${result.card}`}>
      <div className="text-center mb-5">
        <h2 className={`text-2xl md:text-3xl font-bold mb-2 ${isDark ? 'text-stone-100' : 'text-[#4A2F1D]'}`}>{userInfo.name}님의 결과</h2>
        <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-bold ${isDark ? 'bg-stone-700 text-stone-100' : 'bg-amber-200 text-[#4A2F1D]'}`}>
          번아웃 지수: {totalScore > 0 ? '+' : ''}{totalScore}점
        </div>
        <h3 className={`text-3xl font-bold mt-3 ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>“{result.title}”</h3>
      </div>

      <div className="flex justify-center mb-6">
        <CssToast tone={result.tone} />
      </div>

      <p className={`text-center p-4 rounded-xl mb-6 ${isDark ? 'bg-white/10 text-stone-100' : 'bg-white/80 text-[#4A2F1D]'}`}>
        {result.desc}
      </p>

      <div className={`${isDark ? 'bg-white/10 text-stone-100' : 'bg-white/95 text-[#4A2F1D]'} p-5 rounded-2xl mb-6 border border-black/5`}>
        <h4 className="font-bold text-lg mb-3">통계로 보는 나의 특징</h4>
        <p className="text-sm mb-4 opacity-85">
          동일 연령대({userInfo.age} {userInfo.gender}성) 평균과 비교했을 때 차이가 큰 항목입니다.
        </p>

        <div className="space-y-3">
          <div className="bg-white text-[#4A2F1D] p-3 rounded-xl border border-red-200">
            <span className="inline-block bg-[#F76C6C] text-white text-xs px-2 py-0.5 rounded-full mr-2">가장 큰 차이</span>
            <b>{top1?.name}</b> — <span className="text-[#F76C6C] font-bold">{top1 ? diffText(top1) : '-'}</span>
          </div>
          <div className="bg-white text-[#4A2F1D] p-3 rounded-xl border border-teal-200">
            <span className="inline-block bg-[#48C0B5] text-white text-xs px-2 py-0.5 rounded-full mr-2">두 번째 차이</span>
            <b>{top2?.name}</b> — <span className="text-[#48C0B5] font-bold">{top2 ? diffText(top2) : '-'}</span>
          </div>
        </div>
      </div>

      <ComparisonChart answers={answers} groupAvgs={groupAvgs} qMeta={qMeta} />

      <div className={`mt-6 p-4 rounded-xl border-2 ${isDark ? 'bg-[#1e3a36]/60 border-[#2c7a72] text-[#cfe9e4]' : 'bg-[#e6f4f1] border-[#48C0B5] text-[#2c7a72]'}`}>
        <h5 className="font-bold mb-2">국가데이터처 메시지</h5>
        <p className="text-sm leading-relaxed">
          이 콘텐츠는 KOSIS 통계 기반 비교 방식을 차용해 제작된 체험형 서비스입니다.
          일상 데이터를 쉽고 재미있게 접하며 통계와 가까워질 수 있도록 구성했습니다.
        </p>
      </div>

      <button
        onClick={onRestart}
        className={`w-full mt-6 py-4 rounded-2xl text-lg font-bold border-2 ${
          isDark ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white' : 'bg-[#D6A850] hover:bg-[#c29643] border-[#b0873a] text-white'
        }`}
      >
        새 반죽으로 다시 시작하기 ↺
      </button>
    </motion.div>
  );
}

export default function App() {
  const [step, setStep] = useState(0);
  const [userInfo, setUserInfo] = useState({ name: '', age: '20대', gender: '여' });
  const [groupAvgs, setGroupAvgs] = useState([]);
  const [answers, setAnswers] = useState([]);

  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @font-face {
        font-family: 'Paperlogy';
        font-weight: 400;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-4Regular.woff2') format('woff2');
      }
      @font-face {
        font-family: 'Paperlogy';
        font-weight: 700;
        src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2408-3@1.0/Paperlogy-7Bold.woff2') format('woff2');
      }
      * { font-family: 'Paperlogy', sans-serif !important; }

      /* 민트 땡땡이 배경 */
      .css-mint-bg {
        background-color: #C5E0D8 !important;
        background-image:
          radial-gradient(#ffffff 18%, transparent 19%),
          radial-gradient(#ffffff 18%, transparent 19%) !important;
        background-size: 30px 30px !important;
        background-position: 0 0, 15px 15px !important;
        background-attachment: fixed !important;
      }

      /* 크래커 카드 + 물결(스캘럽) 테두리 */
      .cracker-card {
        background-color: #F3D289;
        background-image: radial-gradient(#D6A850 13%, transparent 14%);
        background-size: 38px 38px;
        border: 4px solid #D6A850;
        border-radius: 26px;
        position: relative;
      }
      .cracker-card::before {
        content: "";
        position: absolute;
        inset: -10px;
        border-radius: 34px;
        z-index: -1;
        background:
          radial-gradient(circle at 10px 10px, #D6A850 8px, transparent 8.5px) 0 0 / 24px 24px;
        opacity: .9;
      }

      /* 보통씨 */
      .botong-wrap { width: 112px; height: 112px; position: relative; margin: 0 auto; }
      .botong-hair {
        position: absolute; inset: 8px 8px 22px 8px;
        background: #6E4C3A; border: 4px solid #4A2F1D;
        border-radius: 46% 54% 52% 48%;
      }
      .botong-face {
        position: absolute; left: 22px; top: 22px;
        width: 66px; height: 62px; background: #FFE8DF;
        border: 3px solid #4A2F1D; border-radius: 48%;
      }
      .eye { position: absolute; top: 22px; width: 6px; height: 8px; background: #4A2F1D; border-radius: 50%; }
      .eye.left { left: 17px; } .eye.right { right: 17px; }
      .nose { position: absolute; left: 30px; top: 30px; width: 5px; height: 5px; background: #4A2F1D; border-radius: 50%; }
      .mouth {
        position: absolute; left: 26px; top: 39px; width: 13px; height: 9px;
        border: 3px solid #4A2F1D; border-top: none; border-radius: 0 0 10px 10px;
      }
      .blush { position: absolute; top: 34px; width: 14px; height: 10px; background: #F7B9B9; border-radius: 50%; opacity: .8; }
      .blush.left { left: 5px; } .blush.right { right: 5px; }
      .botong-body {
        position: absolute; left: 26px; bottom: 0; width: 60px; height: 38px;
        background: #62C8BE; border: 4px solid #4A2F1D; border-radius: 20px 20px 26px 26px;
      }
      .botong-hand {
        position: absolute; left: 10px; bottom: 10px; width: 20px; height: 28px;
        border: 4px solid #4A2F1D; border-left: none; border-radius: 0 16px 16px 0;
        transform: rotate(10deg); background: #FFE8DF;
      }

      /* CSS 토스트 */
      .toast {
        width: 180px; height: 180px; position: relative;
        border-radius: 34px 34px 22px 22px;
        border: 6px solid #5E3A28;
        background: transparent;
      }
      .toast-inner {
        position: absolute; inset: 14px;
        border-radius: 24px 24px 16px 16px; background: #F5D6A7;
      }
      .toast.soft .toast-inner { filter: brightness(1.05); }
      .toast.normal .toast-inner { filter: sepia(.2) saturate(1.12); }
      .toast.dry .toast-inner { filter: brightness(.87) sepia(.35) contrast(1.02); }
      .toast.burnt .toast-inner { filter: brightness(.5) sepia(.45) contrast(1.2); }

      .toast-face {
        position: absolute; left: 50%; top: 53%; transform: translate(-50%,-50%);
        display: flex; align-items: center; gap: 14px; z-index: 2;
      }
      .t-eye { width: 9px; height: 9px; background: #4A2F1D; border-radius: 50%; }
      .t-mouth { width: 16px; height: 8px; border-bottom: 3px solid #4A2F1D; border-radius: 0 0 10px 10px; }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleStart = (info) => {
    setUserInfo(info);
    const key = `${info.age} ${info.gender}`;
    setGroupAvgs(VIRTUAL_CSV_DATA[key] || VIRTUAL_CSV_DATA['20대 여']);
    setAnswers([]);
    setStep(1);
  };

  const handleAnswer = (opt) => {
    setAnswers(prev => [...prev, { score: opt.score, value: opt.value }]);
    setStep(prev => prev + 1);
  };

  const handleRestart = () => {
    setStep(0);
    setAnswers([]);
  };

  return (
    <div className="css-mint-bg min-h-screen w-full flex items-center justify-center p-4 text-[#4A2F1D]">
      <div className="max-w-md w-full my-8">
        {step === 0 && <IntroScreen onStart={handleStart} />}
        {step > 0 && step <= Q_META.length && (
          <QuestionScreen
            meta={Q_META[step - 1]}
            avg={groupAvgs[step - 1]}
            step={step}
            total={Q_META.length}
            onAnswer={handleAnswer}
          />
        )}
        {step > Q_META.length && (
          <ResultScreen
            userInfo={userInfo}
            answers={answers}
            groupAvgs={groupAvgs}
            qMeta={Q_META}
            onRestart={handleRestart}
          />
        )}
      </div>
    </div>
  );
}
