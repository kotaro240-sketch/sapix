import { useState, useEffect, useRef } from 'react';
import { callClaude, callWithImage } from './api.js';
import { storageGet, storageSet } from './storage.js';

// ── Theme ────────────────────────────────────────────────────────
const T = {
  // 共通
  bg: '#F7F3EE', text: '#1A1A1A', muted: '#888', border: '#E8DDD0',
  white: '#FFFFFF',
  // 社会（暖色）
  soc_main: '#E8783A', soc_light: '#FFF4EC', soc_card: '#FFFFFF',
  // 理科（寒色・深夜ラボ）
  sci_bg: '#0D1B2A', sci_card: '#112236', sci_teal: '#00C9A7',
  sci_blue: '#4FC3F7', sci_amber: '#FFD166', sci_green: '#6BCB77',
  sci_red: '#FF6B6B', sci_muted: '#7EA8C9', sci_border: '#1E3A55',
  sci_text: '#E8F4FD',
};

const NAV_TABS = [
  { id: 'home',    icon: '🏠', label: 'ホーム' },
  { id: 'shakai',  icon: '🗾', label: '社会' },
  { id: 'rika',    icon: '🔬', label: '理科' },
  { id: 'history', icon: '📊', label: 'きろく' },
];

// ── Shared components ────────────────────────────────────────────
function Btn({ children, onClick, color = '#E8783A', outline = false, full = false, disabled = false, small = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: outline ? 'transparent' : color,
        color: outline ? color : '#fff',
        border: `2px solid ${color}`,
        borderRadius: 14,
        padding: small ? '7px 16px' : '12px 24px',
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: small ? 13 : 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        width: full ? '100%' : undefined,
        transition: 'all .15s',
      }}
    >
      {children}
    </button>
  );
}

function Card({ children, style = {} }) {
  return (
    <div style={{
      background: T.white, borderRadius: 18, padding: 18,
      marginBottom: 14, boxShadow: '0 2px 12px rgba(0,0,0,.07)',
      border: `1px solid ${T.border}`, ...style,
    }}>
      {children}
    </div>
  );
}

function Badge({ children, color }) {
  return (
    <span style={{
      background: color + '22', color, border: `1px solid ${color}44`,
      borderRadius: 8, padding: '3px 10px', fontSize: 12, fontWeight: 700,
    }}>
      {children}
    </span>
  );
}

// ── HOME TAB ─────────────────────────────────────────────────────
function HomeTab({ onNav, socWrong, sciWrong, history }) {
  const todayHistory = history.filter(h => Date.now() - h.date < 86400000);
  return (
    <div style={{ padding: '20px 16px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontWeight: 900, fontSize: 24, margin: 0 }}>
          🐾 ゆりラボ
        </h1>
        <p style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>今日もいっしょにがんばろう！</p>
      </div>

      {/* Quick status */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
        {[
          { label: '今日の学習', value: todayHistory.length + '回', icon: '📚', color: T.soc_main },
          { label: '復習待ち（社会）', value: socWrong + '問', icon: '🗾', color: '#6BCB77' },
          { label: '復習待ち（理科）', value: sciWrong + '問', icon: '🔬', color: '#4FC3F7' },
          { label: '総学習回数', value: history.length + '回', icon: '🏆', color: '#C77DFF' },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: 'center', padding: 14 }}>
            <div style={{ fontSize: 24 }}>{s.icon}</div>
            <div style={{ fontWeight: 900, fontSize: 22, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{s.label}</div>
          </Card>
        ))}
      </div>

      {/* Subject buttons */}
      <Card style={{ background: '#FFF4EC', border: `2px solid ${T.soc_main}44` }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12 }}>🗾 社会を学ぶ</div>
        <p style={{ color: T.muted, fontSize: 13, marginBottom: 12 }}>キーワード抽出・一問一答・なぜ？問題・地図問題</p>
        <Btn onClick={() => onNav('shakai')} color={T.soc_main} full>社会ルームへ →</Btn>
      </Card>

      <Card style={{ background: '#0D1B2A', border: `2px solid #00C9A744` }}>
        <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 12, color: '#00C9A7' }}>🔬 理科を学ぶ</div>
        <p style={{ color: '#7EA8C9', fontSize: 13, marginBottom: 12 }}>仕組み理解・実験ストーリー・対話形式コーチング</p>
        <Btn onClick={() => onNav('rika')} color='#00C9A7' full>理科ラボへ →</Btn>
      </Card>
    </div>
  );
}

// ── HISTORY TAB ──────────────────────────────────────────────────
function HistoryTab({ history, socWrong, sciWrong, onClearWrong }) {
  return (
    <div style={{ padding: '20px 16px' }}>
      <h2 style={{ fontWeight: 900, fontSize: 20, marginBottom: 16 }}>📊 学習きろく</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 }}>
        {[
          { label: '総学習', value: history.length + '回', color: T.soc_main },
          { label: '今週', value: history.filter(h => Date.now()-h.date < 7*86400000).length + '回', color: '#6BCB77' },
          { label: '今月', value: history.filter(h => Date.now()-h.date < 30*86400000).length + '回', color: '#4FC3F7' },
        ].map((s, i) => (
          <Card key={i} style={{ textAlign: 'center', padding: 12 }}>
            <div style={{ fontWeight: 900, fontSize: 20, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{s.label}</div>
          </Card>
        ))}
      </div>

      <Card>
        <div style={{ fontWeight: 800, marginBottom: 10 }}>最近の学習</div>
        {history.length === 0 ? (
          <p style={{ color: T.muted, fontSize: 13 }}>まだきろくがないよ！</p>
        ) : history.slice(0, 15).map((h, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < Math.min(history.length, 15)-1 ? `1px solid ${T.border}` : 'none' }}>
            <div>
              <span style={{ fontSize: 13 }}>{h.subject === 'shakai' ? '🗾' : '🔬'}</span>
              <span style={{ fontWeight: 700, fontSize: 13, marginLeft: 6 }}>{h.unit}</span>
              <span style={{ color: T.muted, fontSize: 11, marginLeft: 8 }}>{new Date(h.date).toLocaleDateString('ja-JP')}</span>
            </div>
            <Badge color={h.score >= 80 ? '#6BCB77' : h.score >= 60 ? '#FFD166' : '#FF6B6B'}>
              {h.correct}/{h.total}問
            </Badge>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ── SOCIAL STUDIES APP ────────────────────────────────────────────
function ShakaiApp({ onAddHistory, wrongList, setWrongList }) {
  const [step, setStep] = useState('input'); // input|loading|learn|quiz|done
  const [unitName, setUnitName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [imgData, setImgData] = useState(null);
  const [imgMime, setImgMime] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [lessonData, setLessonData] = useState(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [allQ, setAllQ] = useState([]);
  const [dialogState, setDialogState] = useState('asking');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [userAns, setUserAns] = useState('');
  const [sessionLog, setSessionLog] = useState([]);
  const [grading, setGrading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, dialogState]);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImgData(ev.target.result.split(',')[1]); setImgMime(f.type); };
    r.readAsDataURL(f);
  };

  const generate = async () => {
    if (!textInput.trim() && !imgData) return;
    setStep('loading');
    const loadMsgs = ['テキストを読んでいるよ…', '問題を考えています…', 'もうすぐだよ…'];
    let mi = 0; setLoadingMsg(loadMsgs[0]);
    const id = setInterval(() => { mi = (mi+1) % loadMsgs.length; setLoadingMsg(loadMsgs[mi]); }, 2000);

    const prompt = `あなたはサピックス小学5年生社会の先生です。
単元名：${unitName || '社会'}
以下のテキストから学習コンテンツをJSON形式で作ってください。

出力形式（JSONのみ、他の文字不要）:
{
  "unit": "単元名",
  "keywords": [{"word":"キーワード","reading":"よみ","meaning":"意味（1文）","priority":"最重要|重要|基本"}],
  "questions": [
    {"type":"一問一答","question":"問題","answer":"正解と解説","priority":"最重要|重要|基本"},
    {"type":"なぜ？","question":"なぜ〜でしょう？","answer":"解説","priority":"重要"},
    {"type":"地図・図表","question":"地図や図に関する問題","answer":"解説","priority":"基本"}
  ]
}
条件：一問一答5〜7問、なぜ？2〜3問、地図・図表1〜2問。キーワードは5〜10個。`;

    try {
      let raw = imgData
        ? await callWithImage(imgData, imgMime, prompt, 2500)
        : await callClaude([{ role:'user', content: prompt + '\n\n【テキスト】\n' + textInput }], 2500);
      clearInterval(id);
      const json = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setLessonData(json);
      const qs = [...(json.questions || [])];
      setAllQ(qs);
      setCurrentQ(0);
      setChatMsgs([{ role:'coach', text:`「${json.unit}」の問題を始めよう！1問ずつ進めていくよ 📝\n\n${qs[0]?.question || ''}` }]);
      setDialogState('asking');
      setStep('quiz');
    } catch(e) {
      clearInterval(id);
      console.error(e);
      setStep('input');
      alert('エラーが発生しました。もう一度試してね。');
    }
  };

  const submitAnswer = async () => {
    if (!userAns.trim() || grading) return;
    const q = allQ[currentQ];
    const ans = userAns.trim();
    setUserAns('');
    setGrading(true);
    setChatMsgs(prev => [...prev, { role:'user', text: ans }]);

    try {
      const gradePrompt = `問題：${q.question}\n正解：${q.answer}\n子どもの回答：${ans}\n\nJSON形式のみ出力:\n{"verdict":"◎|△|×","good":"よかった点（1文）","missing":"足りない点（1文、なければnull）"}`;
      const raw = await callClaude([{ role:'user', content: gradePrompt }], 300);
      const g = JSON.parse(raw.replace(/```json|```/g, '').trim());

      if (g.verdict === '◎') {
        setChatMsgs(prev => [...prev,
          { role:'coach', text:`${g.good} 正解！🎉`, color:'green' },
          { role:'coach', text:`ちょっと追加で聞くね👀 どうしてそうなるか、自分の言葉で説明してみて？`, color:'amber' }
        ]);
        setDialogState('why');
        setSessionLog(prev => [...prev, { q, ans, verdict:'◎' }]);
      } else {
        setChatMsgs(prev => [...prev,
          { role:'coach', text:`${g.verdict === '△' ? '惜しい！△だよ。' : 'うーん、ちょっと違うかな。'}\n${g.missing ? '足りないのは：' + g.missing : ''}\n\nヒント💡を出すね。もう一度考えてみて！`, color: g.verdict === '△' ? 'amber' : 'red' }
        ]);
        setDialogState('hinted');
        setSessionLog(prev => [...prev, { q, ans, verdict: g.verdict }]);
        if (g.verdict === '×') {
          setWrongList(prev => {
            const filtered = prev.filter(w => w.question !== q.question);
            return [{ ...q, wrongAt: Date.now(), unit: lessonData?.unit, subject:'shakai' }, ...filtered].slice(0, 100);
          });
        }
      }
    } catch(e) {
      setChatMsgs(prev => [...prev, { role:'coach', text:'採点エラー。もう一度入力してね。', color:'red' }]);
    }
    setGrading(false);
  };

  const submitWhy = async () => {
    if (!userAns.trim() || grading) return;
    const q = allQ[currentQ];
    const ans = userAns.trim();
    setUserAns('');
    setGrading(true);
    setChatMsgs(prev => [...prev, { role:'user', text: ans }]);
    try {
      const raw = await callClaude([{ role:'user', content: `模範解答：${q.answer}\n子どもの説明：${ans}\nJSON形式のみ: {"feedback":"フィードバック（1〜2文、子ども向け）"}` }], 200);
      const r = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setChatMsgs(prev => [...prev,
        { role:'coach', text: r.feedback, color:'green' },
        { role:'coach', text: `✨ 模範解答：${q.answer}`, color:'gray' }
      ]);
    } catch(e) {
      setChatMsgs(prev => [...prev, { role:'coach', text:`✨ 模範解答：${q.answer}`, color:'gray' }]);
    }
    setGrading(false);
    setDialogState('explained');
  };

  const submitRetry = async () => {
    if (!userAns.trim() || grading) return;
    const q = allQ[currentQ];
    const ans = userAns.trim();
    setUserAns('');
    setGrading(true);
    setChatMsgs(prev => [...prev, { role:'user', text: ans }]);
    try {
      const raw = await callClaude([{ role:'user', content: `模範解答：${q.answer}\n再挑戦：${ans}\nJSON形式のみ: {"ok":true,"comment":"評価（1文）"}` }], 150);
      const r = JSON.parse(raw.replace(/```json|```/g, '').trim());
      setChatMsgs(prev => [...prev,
        { role:'coach', text: r.comment, color: r.ok ? 'green' : 'amber' },
        { role:'coach', text: `✨ 模範解答：${q.answer}`, color:'gray' }
      ]);
    } catch(e) {
      setChatMsgs(prev => [...prev, { role:'coach', text:`✨ 模範解答：${q.answer}`, color:'gray' }]);
    }
    setGrading(false);
    setDialogState('explained');
  };

  const nextQ = () => {
    const next = currentQ + 1;
    if (next >= allQ.length) {
      const correct = sessionLog.filter(l => l.verdict === '◎').length;
      onAddHistory({ subject:'shakai', unit: lessonData?.unit, correct, total: allQ.length, score: Math.round(correct/allQ.length*100), date: Date.now() });
      setStep('done');
      return;
    }
    setCurrentQ(next);
    const q = allQ[next];
    setChatMsgs(prev => [...prev, { role:'divider' }, { role:'coach', text:`次の問題！(${next+1}/${allQ.length})\n\n${q.question}` }]);
    setDialogState('asking');
  };

  const msgColor = (c) => ({ green:'#6BCB77', amber:'#FFD166', red:'#FF6B6B', gray:'#888' }[c] || T.soc_main);

  if (step === 'input') return (
    <div style={{ padding: 16 }}>
      <h2 style={{ fontWeight:900, fontSize:20, marginBottom:16 }}>🗾 社会ルーム</h2>

      <Card>
        <label style={{ fontWeight:700, fontSize:13, color:T.muted, display:'block', marginBottom:6 }}>単元名</label>
        <input value={unitName} onChange={e=>setUnitName(e.target.value)}
          placeholder="例：関東地方②、D09" style={{ ...inpStyle, marginBottom:0 }} />
      </Card>

      <Card>
        <label style={{ fontWeight:700, fontSize:13, color:T.muted, display:'block', marginBottom:6 }}>① テキストを貼り付け</label>
        <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
          placeholder="テキストの内容をここに貼り付けてね…"
          style={{ ...inpStyle, minHeight:100, resize:'vertical' }} />
      </Card>

      <Card>
        <label style={{ fontWeight:700, fontSize:13, color:T.muted, display:'block', marginBottom:6 }}>② 教材の写真をアップロード</label>
        <div style={{ border:`2px dashed ${imgData ? T.soc_main : T.border}`, borderRadius:12, padding:20, textAlign:'center', cursor:'pointer' }}
          onClick={() => fileRef.current.click()}>
          {imgData ? <span style={{ color:T.soc_main, fontWeight:700 }}>✅ 画像が読み込まれました</span>
            : <span style={{ color:T.muted }}>📷 タップして写真を選択</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      </Card>

      {wrongList.filter(w=>w.subject==='shakai').length > 0 && (
        <Card style={{ border:`2px solid #FF6B6B44`, background:'#fff8f8' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <Badge color="#FF6B6B">🔁 復習待ち</Badge>
              <span style={{ color:T.muted, fontSize:13, marginLeft:8 }}>{wrongList.filter(w=>w.subject==='shakai').length}問</span>
            </div>
            <Btn small color="#FF6B6B" onClick={() => {
              const rqs = wrongList.filter(w=>w.subject==='shakai').slice(0,5);
              setAllQ(rqs); setCurrentQ(0);
              setLessonData({ unit:'復習' });
              setChatMsgs([{ role:'coach', text:`復習モード！まちがえた問題にもう一度チャレンジ💪\n\n${rqs[0]?.question}` }]);
              setDialogState('asking'); setStep('quiz');
            }}>復習する →</Btn>
          </div>
        </Card>
      )}

      <Btn full color={T.soc_main} onClick={generate} disabled={!textInput.trim() && !imgData}>
        ✨ 問題を作る！
      </Btn>
    </div>
  );

  if (step === 'loading') return (
    <div style={{ padding:40, textAlign:'center' }}>
      <div style={{ fontSize:48, marginBottom:12, animation:'spin 1s linear infinite', display:'inline-block' }}>🗾</div>
      <p style={{ fontWeight:800, fontSize:18 }}>{loadingMsg}</p>
      <p style={{ color:T.muted, fontSize:13 }}>AIが問題を作っています…</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step === 'learn' && lessonData) return (
    <div style={{ padding:16 }}>
      {/* keywords */}
      <Card style={{ background:'#FFF9E6' }}>
        <div style={{ fontWeight:800, marginBottom:10 }}>⭐ 覚えるキーワード</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
          {(lessonData.keywords||[]).map((k,i) => (
            <div key={i} style={{ background:'#fff', borderRadius:10, padding:'6px 12px', border:`2px solid ${k.priority==='最重要'?T.soc_main:T.border}` }}>
              <div style={{ fontWeight:800, fontSize:13 }}>{k.word}</div>
              <div style={{ fontSize:11, color:T.muted }}>{k.meaning}</div>
            </div>
          ))}
        </div>
      </Card>
      <Btn full color={T.soc_main} onClick={() => {
        setCurrentQ(0);
        setChatMsgs([{ role:'coach', text:`問題を始めるよ！(1/${allQ.length})\n\n${allQ[0]?.question}` }]);
        setDialogState('asking');
        setStep('quiz');
      }}>問題を始める！</Btn>
    </div>
  );

  if (step === 'quiz') return (
    <div style={{ padding:16 }}>
      {/* progress */}
      <div style={{ marginBottom:12 }}>
        <div style={{ height:6, background:'#eee', borderRadius:3, overflow:'hidden' }}>
          <div style={{ width:`${((currentQ+1)/allQ.length)*100}%`, height:'100%', background:T.soc_main, borderRadius:3, transition:'width .4s' }} />
        </div>
        <div style={{ fontSize:12, color:T.muted, marginTop:4, textAlign:'right' }}>{currentQ+1}/{allQ.length}問</div>
      </div>

      {/* chat */}
      <Card style={{ maxHeight:360, overflowY:'auto', padding:14 }}>
        {chatMsgs.map((m,i) => {
          if (m.role==='divider') return <div key={i} style={{ height:1, background:T.border, margin:'10px 0' }} />;
          if (m.role==='user') return (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <div style={{ background:'#E8F4FF', borderRadius:'14px 4px 14px 14px', padding:'10px 14px', maxWidth:'80%', fontSize:14, lineHeight:1.6, whiteSpace:'pre-wrap' }}>
                {m.text}
              </div>
            </div>
          );
          return (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ background: msgColor(m.color) + '22', border:`2px solid ${msgColor(m.color)}`, borderRadius:'50%', width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                {m.color==='green'?'🎉':m.color==='amber'?'💡':m.color==='red'?'💪':'📝'}
              </div>
              <div style={{ background:'#f8f8f8', borderRadius:'4px 14px 14px 14px', padding:'10px 14px', fontSize:14, lineHeight:1.7, flex:1, whiteSpace:'pre-wrap' }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </Card>

      {/* input */}
      {(dialogState==='asking'||dialogState==='hinted') && (
        <Card>
          <textarea value={userAns} onChange={e=>setUserAns(e.target.value)}
            placeholder={dialogState==='hinted'?'もう一度考えてみよう…':'答えを書いてね…'}
            style={{ ...inpStyle, minHeight:70, resize:'vertical' }} />
          <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
            {dialogState==='hinted' && (
              <Btn small outline color={T.muted} onClick={() => {
                setChatMsgs(prev => [...prev, { role:'coach', text:`✨ 正解：${allQ[currentQ].answer}`, color:'gray' }]);
                setDialogState('explained');
              }}>答えを見る</Btn>
            )}
            <Btn small color={T.soc_main} onClick={dialogState==='hinted'?submitRetry:submitAnswer} disabled={grading}>
              {grading?'採点中…':'→ 答える'}
            </Btn>
          </div>
        </Card>
      )}

      {dialogState==='why' && (
        <Card style={{ border:`2px solid #FFD16644` }}>
          <p style={{ fontWeight:700, color:'#C49A00', marginBottom:8, fontSize:13 }}>💡 どうしてそうなるか説明してみよう！</p>
          <textarea value={userAns} onChange={e=>setUserAns(e.target.value)}
            placeholder="自分の言葉で説明してみてね…"
            style={{ ...inpStyle, minHeight:70 }} />
          <Btn full small color="#C49A00" onClick={submitWhy} disabled={grading}>
            {grading?'確認中…':'💬 説明する'}
          </Btn>
        </Card>
      )}

      {dialogState==='explained' && (
        <Btn full color={currentQ+1>=allQ.length?'#6BCB77':T.soc_main} onClick={nextQ}>
          {currentQ+1>=allQ.length?'🎉 おわり！':'次の問題へ →'}
        </Btn>
      )}
    </div>
  );

  if (step==='done') return (
    <div style={{ padding:16, textAlign:'center' }}>
      <Card style={{ padding:32 }}>
        <div style={{ fontSize:56 }}>🎊</div>
        <h2 style={{ fontWeight:900, fontSize:22, margin:'12px 0 8px' }}>
          {sessionLog.filter(l=>l.verdict==='◎').length}/{allQ.length}問 正解！
        </h2>
        <p style={{ color:T.muted, marginBottom:20 }}>
          {sessionLog.filter(l=>l.verdict!=='◎').length>0 ? `${sessionLog.filter(l=>l.verdict!=='◎').length}問まちがえたよ。復習タブで確認しよう！` : '全問正解！すごい！🐾'}
        </p>
        <Btn color={T.soc_main} onClick={() => { setStep('input'); setLessonData(null); setTextInput(''); setImgData(null); setSessionLog([]); }}>
          別の単元を学ぶ
        </Btn>
      </Card>
    </div>
  );

  return null;
}

// ── SCIENCE APP ──────────────────────────────────────────────────
function RikaApp({ onAddHistory, wrongList, setWrongList }) {
  const [step, setStep] = useState('input');
  const [unitName, setUnitName] = useState('');
  const [textInput, setTextInput] = useState('');
  const [imgData, setImgData] = useState(null);
  const [imgMime, setImgMime] = useState(null);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [lessonData, setLessonData] = useState(null);
  const [allQ, setAllQ] = useState([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [dialogState, setDialogState] = useState('asking');
  const [chatMsgs, setChatMsgs] = useState([]);
  const [userAns, setUserAns] = useState('');
  const [sessionLog, setSessionLog] = useState([]);
  const [grading, setGrading] = useState(false);
  const fileRef = useRef();
  const bottomRef = useRef();

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatMsgs, dialogState]);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => { setImgData(ev.target.result.split(',')[1]); setImgMime(f.type); };
    r.readAsDataURL(f);
  };

  const sciCard = (extra={}) => ({ background:T.sci_card, borderRadius:16, padding:16, marginBottom:12, border:`1px solid ${T.sci_border}`, color:T.sci_text, ...extra });

  const generate = async () => {
    if (!textInput.trim() && !imgData) return;
    setStep('loading');
    const msgs = ['テキストを読んでいるよ…🔬','しくみを整理中…⚗️','問題を作っています…🧪'];
    let mi=0; setLoadingMsg(msgs[0]);
    const id = setInterval(()=>{ mi=(mi+1)%msgs.length; setLoadingMsg(msgs[mi]); }, 1800);

    const prompt = `あなたはサピックス小学5年理科の家庭学習コーチです。
単元名：${unitName||'理科'}
以下のテキストをもとに学習コンテンツをJSON形式で作成してください。

出力形式（JSONのみ）:
{
  "unit":"単元名",
  "mechanisms":[{"title":"しくみ（20文字以内）","detail":"説明（50文字以内）"}],
  "experiment":{"hypothesis":"仮説（1文）","method":"方法（2文）","result":"結果（1文）","conclusion":"結論（1文）"},
  "quiz":[{"type":"条件比較","question":"条件を変えた問題","choices":["A","B","C"],"answer":"正解","answer_index":0,"hint":"ヒント（正解は言わない）","model_why":"なぜそうなるかの説明","error_type":"知識不足|条件の見落とし|実験理解不足"}],
  "explain":[{"type":"説明チャレンジ","question":"なぜ〜でしょう？","hint":"ヒント","model_answer":"模範解答（1〜2文）","good_keywords":["キーワード"],"error_type":"理由説明不足"}]
}
mechanisms:3つ、quiz:3問、explain:2問。小学5年生向け。`;

    try {
      let raw = imgData
        ? await callWithImage(imgData, imgMime, prompt, 2500)
        : await callClaude([{ role:'user', content: prompt+'\n\n【テキスト】\n'+textInput }], 2500);
      clearInterval(id);
      const json = JSON.parse(raw.replace(/```json|```/g,'').trim());
      setLessonData(json);
      setAllQ([...(json.quiz||[]).map(q=>({...q,section:'quiz'})), ...(json.explain||[]).map(q=>({...q,section:'explain'}))]);
      setCurrentQ(0);
      setChatMsgs([{ role:'coach', text:`「${json.unit}」の学習を始めよう！しくみを確認したら問題に進むよ 🔬` }]);
      setStep('learn');
    } catch(e) {
      clearInterval(id);
      console.error(e);
      setStep('input');
      alert('エラーが発生しました。もう一度試してね。');
    }
  };

  const submitAns = async (isRetry=false, isWhy=false) => {
    if (!userAns.trim() || grading) return;
    const q = allQ[currentQ];
    const ans = userAns.trim();
    setUserAns('');
    setGrading(true);
    setChatMsgs(prev=>[...prev, { role:'user', text:ans }]);

    try {
      if (isWhy) {
        const raw = await callClaude([{ role:'user', content:`なぜ？の問い：${q.question||'なぜそうなるか'}\n模範解答：${q.model_why||q.model_answer||q.answer}\n子どもの説明：${ans}\nJSON: {"feedback":"フィードバック（1〜2文）"}` }], 200);
        const r = JSON.parse(raw.replace(/```json|```/g,'').trim());
        setChatMsgs(prev=>[...prev, { role:'coach', text:r.feedback, color:'green' }, { role:'coach', text:`✨ 模範解答：${q.model_why||q.model_answer||q.answer}`, color:'gray' }]);
        setGrading(false); setDialogState('explained'); return;
      }

      const gradePrompt = `問題：${q.question}\n模範解答：${q.model_answer||q.answer}\nキーワード：${(q.good_keywords||[]).join('、')}\n子どもの回答：${ans}\nJSON形式のみ: {"verdict":"◎|△|×","good":"よかった点（1文）","missing":"足りない点（1文またはnull）"}`;
      const raw = await callClaude([{ role:'user', content: gradePrompt }], 300);
      const g = JSON.parse(raw.replace(/```json|```/g,'').trim());

      if (isRetry || g.verdict==='◎') {
        if (g.verdict==='◎') {
          setChatMsgs(prev=>[...prev,
            { role:'coach', text:`${g.good} 正解！🎉`, color:'green' },
            { role:'coach', text:`どうしてそうなるか説明してみて？🤔`, color:'amber' }
          ]);
          setDialogState('why');
          setSessionLog(prev=>[...prev, { q, ans, verdict:'◎' }]);
        } else {
          setChatMsgs(prev=>[...prev, { role:'coach', text:`${g.good||'惜しかったね！'}\n✨ 模範解答：${q.model_answer||q.answer}`, color:'amber' }]);
          setGrading(false); setDialogState('explained'); return;
        }
      } else {
        setChatMsgs(prev=>[...prev, { role:'coach', text:`${g.verdict==='△'?'惜しい！△だよ。':'うーん、方向が違うかな。'}\nヒント💡：${q.hint}\n\nもう一度考えてみて！`, color:g.verdict==='△'?'amber':'red' }]);
        setDialogState('hinted');
        setSessionLog(prev=>[...prev, { q, ans, verdict:g.verdict }]);
        if (g.verdict==='×') {
          setWrongList(prev=>{
            const f=prev.filter(w=>w.question!==q.question);
            return [{ ...q, wrongAt:Date.now(), unit:lessonData?.unit, subject:'rika' }, ...f].slice(0,100);
          });
        }
      }
    } catch(e) {
      setChatMsgs(prev=>[...prev, { role:'coach', text:'採点エラー。もう一度試してね。', color:'red' }]);
    }
    setGrading(false);
  };

  const nextQ = () => {
    const next = currentQ + 1;
    if (next >= allQ.length) {
      const correct = sessionLog.filter(l=>l.verdict==='◎').length;
      onAddHistory({ subject:'rika', unit:lessonData?.unit, correct, total:allQ.length, score:Math.round(correct/allQ.length*100), date:Date.now() });
      setStep('done'); return;
    }
    setCurrentQ(next);
    const q = allQ[next];
    setChatMsgs(prev=>[...prev, { role:'divider' }, { role:'coach', text:`次の問題！(${next+1}/${allQ.length}) — ${q.section==='quiz'?'条件比較クイズ':'説明チャレンジ'}\n\n${q.question}` }]);
    setDialogState('asking');
  };

  const msgColor = (c) => ({ green:T.sci_green, amber:T.sci_amber, red:T.sci_red, gray:T.sci_muted }[c]||T.sci_teal);
  const q = allQ[currentQ];

  if (step==='input') return (
    <div style={{ background:T.sci_bg, minHeight:'100%', padding:16 }}>
      <h2 style={{ color:T.sci_teal, fontWeight:900, fontSize:20, marginBottom:16 }}>🔬 理科ラボ</h2>
      <div style={sciCard()}>
        <label style={{ color:T.sci_muted, fontSize:13, fontWeight:700, display:'block', marginBottom:6 }}>単元名</label>
        <input value={unitName} onChange={e=>setUnitName(e.target.value)}
          placeholder="例：光合成と呼吸、D09 豆電球と乾電池"
          style={{ ...inpStyle, background:'#1a3550', color:T.sci_text, border:`1px solid ${T.sci_border}` }} />
      </div>
      <div style={sciCard()}>
        <label style={{ color:T.sci_muted, fontSize:13, fontWeight:700, display:'block', marginBottom:6 }}>① テキストを貼り付け</label>
        <textarea value={textInput} onChange={e=>setTextInput(e.target.value)}
          placeholder="理科のテキストを貼り付けてね…"
          style={{ ...inpStyle, minHeight:100, resize:'vertical', background:'#1a3550', color:T.sci_text, border:`1px solid ${T.sci_border}` }} />
      </div>
      <div style={sciCard()}>
        <label style={{ color:T.sci_muted, fontSize:13, fontWeight:700, display:'block', marginBottom:6 }}>② 教材の写真をアップロード</label>
        <div style={{ border:`2px dashed ${imgData?T.sci_teal:T.sci_border}`, borderRadius:12, padding:20, textAlign:'center', cursor:'pointer' }}
          onClick={()=>fileRef.current.click()}>
          {imgData?<span style={{ color:T.sci_teal, fontWeight:700 }}>✅ 画像が読み込まれました</span>
            :<span style={{ color:T.sci_muted }}>📷 タップして写真を選択</span>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }} />
      </div>

      {wrongList.filter(w=>w.subject==='rika').length>0 && (
        <div style={{ ...sciCard({ border:`2px solid ${T.sci_red}44` }), display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ color:T.sci_text }}>
            <Badge color={T.sci_red}>🔁 復習待ち</Badge>
            <span style={{ color:T.sci_muted, fontSize:13, marginLeft:8 }}>{wrongList.filter(w=>w.subject==='rika').length}問</span>
          </div>
          <Btn small color={T.sci_red} onClick={() => {
            const rqs=wrongList.filter(w=>w.subject==='rika').slice(0,5);
            setAllQ(rqs); setCurrentQ(0); setLessonData({ unit:'復習' });
            setChatMsgs([{ role:'coach', text:`復習モード！まちがえた問題だよ。頑張ろう💪\n\n${rqs[0]?.question}` }]);
            setDialogState('asking'); setStep('quiz');
          }}>復習する →</Btn>
        </div>
      )}

      <Btn full color={T.sci_teal} onClick={generate} disabled={!textInput.trim()&&!imgData}>
        ⚗️ 学習コンテンツを作る！
      </Btn>
    </div>
  );

  if (step==='loading') return (
    <div style={{ background:T.sci_bg, minHeight:'100%', padding:40, textAlign:'center' }}>
      <div style={{ fontSize:48, display:'inline-block', animation:'spin 2s linear infinite' }}>⚛️</div>
      <p style={{ color:T.sci_teal, fontWeight:800, fontSize:18, marginTop:16 }}>{loadingMsg}</p>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (step==='learn'&&lessonData) return (
    <div style={{ background:T.sci_bg, minHeight:'100%', padding:16 }}>
      <div style={sciCard({ border:`1px solid ${T.sci_teal}44` })}>
        <div style={{ fontWeight:800, fontSize:15, color:T.sci_teal, marginBottom:12 }}>⚛️ 今日のしくみ（3つ）</div>
        {(lessonData.mechanisms||[]).map((m,i) => (
          <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
            <div style={{ background:T.sci_teal, color:T.sci_bg, borderRadius:'50%', width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, flexShrink:0 }}>{i+1}</div>
            <div>
              <div style={{ fontWeight:800, fontSize:13, color:T.sci_text }}>{m.title}</div>
              <div style={{ fontSize:12, color:T.sci_muted, marginTop:2 }}>{m.detail}</div>
            </div>
          </div>
        ))}
      </div>
      {lessonData.experiment && (
        <div style={sciCard({ border:`1px solid ${T.sci_blue}44` })}>
          <div style={{ fontWeight:800, fontSize:15, color:T.sci_blue, marginBottom:12 }}>🧪 実験ストーリー</div>
          {[['仮説','💭',T.sci_amber,lessonData.experiment.hypothesis],['方法','🔧',T.sci_blue,lessonData.experiment.method],['結果','📊',T.sci_green,lessonData.experiment.result],['結論','✅',T.sci_teal,lessonData.experiment.conclusion]].map(([l,icon,c,t],i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
              <Badge color={c}>{icon} {l}</Badge>
              <div style={{ fontSize:13, lineHeight:1.7, color:T.sci_text, paddingTop:2 }}>{t}</div>
            </div>
          ))}
        </div>
      )}
      <Btn full color={T.sci_teal} onClick={() => {
        setCurrentQ(0);
        setChatMsgs([{ role:'coach', text:`問題を始めるよ！(1/${allQ.length})\n\n${allQ[0]?.question}` }]);
        setDialogState('asking'); setStep('quiz');
      }}>問題を始める！</Btn>
    </div>
  );

  if (step==='quiz') return (
    <div style={{ background:T.sci_bg, minHeight:'100%', padding:16 }}>
      <div style={{ height:6, background:T.sci_border, borderRadius:3, overflow:'hidden', marginBottom:12 }}>
        <div style={{ width:`${((currentQ+1)/allQ.length)*100}%`, height:'100%', background:T.sci_teal, borderRadius:3, transition:'width .4s' }} />
      </div>
      <div style={{ fontSize:12, color:T.sci_muted, marginBottom:10, textAlign:'right' }}>{currentQ+1}/{allQ.length}問 — {q?.section==='quiz'?'条件比較':'説明チャレンジ'}</div>

      <div style={{ ...sciCard(), maxHeight:380, overflowY:'auto' }}>
        {chatMsgs.map((m,i) => {
          if (m.role==='divider') return <div key={i} style={{ height:1, background:T.sci_border, margin:'10px 0' }} />;
          if (m.role==='user') return (
            <div key={i} style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
              <div style={{ background:`${T.sci_blue}33`, border:`1px solid ${T.sci_blue}44`, borderRadius:'14px 4px 14px 14px', padding:'10px 14px', maxWidth:'80%', fontSize:13, lineHeight:1.6, whiteSpace:'pre-wrap', color:T.sci_text }}>
                {m.text}
              </div>
            </div>
          );
          const mc = msgColor(m.color);
          return (
            <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ background:`${mc}22`, border:`2px solid ${mc}`, borderRadius:'50%', width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>
                {m.color==='green'?'🎉':m.color==='amber'?'💡':m.color==='red'?'💪':'🔬'}
              </div>
              <div style={{ background:T.card2||'#1a2f45', border:`1px solid ${mc}44`, borderRadius:'4px 12px 12px 12px', padding:'10px 14px', fontSize:13, lineHeight:1.7, flex:1, whiteSpace:'pre-wrap', color:T.sci_text }}>
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {(dialogState==='asking'||dialogState==='hinted') && (
        <div style={sciCard()}>
          {q?.section==='quiz'&&q?.choices&&dialogState==='asking' ? (
            <>
              <p style={{ color:T.sci_muted, fontSize:13, marginBottom:8 }}>選んでタップしてね：</p>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {q.choices.map((c,ci) => (
                  <button key={ci} onClick={()=>setUserAns(c)}
                    style={{ background:userAns===c?`${T.sci_teal}33`:'transparent', color:T.sci_text, border:`2px solid ${userAns===c?T.sci_teal:T.sci_border}`, borderRadius:10, padding:'10px 14px', fontFamily:"'Nunito',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', textAlign:'left' }}>
                    {['A','B','C'][ci]}. {c}
                  </button>
                ))}
              </div>
              {userAns && <Btn full color={T.sci_teal} onClick={()=>submitAns(false)} disabled={grading}>{grading?'採点中…':'→ これで答える'}</Btn>}
            </>
          ) : (
            <>
              <textarea value={userAns} onChange={e=>setUserAns(e.target.value)}
                placeholder={dialogState==='hinted'?'ヒントを参考にもう一度…':'答えを書いてね…'}
                style={{ ...inpStyle, minHeight:70, background:'#1a3550', color:T.sci_text, border:`1px solid ${T.sci_border}` }} />
              <div style={{ display:'flex', gap:8, justifyContent:'flex-end', marginTop:8 }}>
                {dialogState==='hinted' && (
                  <Btn small outline color={T.sci_muted} onClick={()=>{ setChatMsgs(prev=>[...prev,{ role:'coach', text:`✨ 模範解答：${q.model_answer||q.answer}`, color:'gray' }]); setDialogState('explained'); }}>答えを見る</Btn>
                )}
                <Btn small color={T.sci_teal} onClick={()=>submitAns(dialogState==='hinted')} disabled={grading}>
                  {grading?'採点中…':'→ 答える'}
                </Btn>
              </div>
            </>
          )}
        </div>
      )}

      {dialogState==='why' && (
        <div style={{ ...sciCard({ border:`1px solid ${T.sci_amber}44` }) }}>
          <p style={{ color:T.sci_amber, fontWeight:700, fontSize:13, marginBottom:8 }}>💡 どうしてそうなるか説明してみよう！</p>
          <textarea value={userAns} onChange={e=>setUserAns(e.target.value)}
            placeholder="自分の言葉で…"
            style={{ ...inpStyle, minHeight:70, background:'#1a3550', color:T.sci_text, border:`1px solid ${T.sci_border}` }} />
          <Btn full color={T.sci_amber} small onClick={()=>submitAns(false,true)} disabled={grading}>
            {grading?'確認中…':'💬 説明する'}
          </Btn>
        </div>
      )}

      {dialogState==='explained' && (
        <Btn full color={currentQ+1>=allQ.length?T.sci_green:T.sci_teal} onClick={nextQ}>
          {currentQ+1>=allQ.length?'🎉 おわり！結果を見る':'次の問題へ →'}
        </Btn>
      )}
    </div>
  );

  if (step==='done') return (
    <div style={{ background:T.sci_bg, minHeight:'100%', padding:16, textAlign:'center' }}>
      <div style={{ ...sciCard({ padding:32 }) }}>
        <div style={{ fontSize:56 }}>🧪</div>
        <h2 style={{ fontWeight:900, fontSize:22, color:T.sci_green, margin:'12px 0 8px' }}>
          {sessionLog.filter(l=>l.verdict==='◎').length}/{allQ.length}問 正解！
        </h2>
        <p style={{ color:T.sci_muted, marginBottom:20 }}>
          {sessionLog.filter(l=>l.verdict!=='◎').length>0?`${sessionLog.filter(l=>l.verdict!=='◎').length}問まちがえたよ。復習タブで確認しよう！`:'全問正解！すごい！🐾'}
        </p>
        <Btn color={T.sci_teal} onClick={()=>{ setStep('input'); setLessonData(null); setTextInput(''); setImgData(null); setSessionLog([]); }}>
          別の単元を学ぶ
        </Btn>
      </div>
    </div>
  );

  return null;
}

// ── Shared input style ────────────────────────────────────────────
const inpStyle = {
  width:'100%', padding:'10px 14px', borderRadius:12,
  border:`2px solid #E8DDD0`, fontFamily:"'Nunito',sans-serif",
  fontSize:14, outline:'none', boxSizing:'border-box',
  background:'#fff', color:'#1A1A1A',
};

// ── ROOT APP ─────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [wrongList, setWrongList] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    setWrongList(storageGet('wrongList') || []);
    setHistory(storageGet('appHistory') || []);
  }, []);
  useEffect(() => { storageSet('wrongList', wrongList); }, [wrongList]);
  useEffect(() => { storageSet('appHistory', history); }, [history]);

  const addHistory = (record) => setHistory(prev => [record, ...prev].slice(0, 100));
  const socWrong = wrongList.filter(w => w.subject === 'shakai').length;
  const sciWrong = wrongList.filter(w => w.subject === 'rika').length;

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
      <div style={{ minHeight:'100vh', background: activeTab==='rika' ? T.sci_bg : T.bg, fontFamily:"'Nunito',sans-serif", paddingBottom:80 }}>

        {/* Content */}
        <div style={{ maxWidth:680, margin:'0 auto' }}>
          {activeTab==='home'    && <HomeTab onNav={setActiveTab} socWrong={socWrong} sciWrong={sciWrong} history={history} />}
          {activeTab==='shakai'  && <ShakaiApp onAddHistory={addHistory} wrongList={wrongList} setWrongList={setWrongList} />}
          {activeTab==='rika'    && <RikaApp   onAddHistory={addHistory} wrongList={wrongList} setWrongList={setWrongList} />}
          {activeTab==='history' && <HistoryTab history={history} socWrong={socWrong} sciWrong={sciWrong} />}
        </div>

        {/* Bottom navigation */}
        <div style={{
          position:'fixed', bottom:0, left:0, right:0,
          background: activeTab==='rika' ? T.sci_card : '#fff',
          borderTop: `1px solid ${activeTab==='rika' ? T.sci_border : T.border}`,
          display:'flex', zIndex:100,
          paddingBottom:'env(safe-area-inset-bottom)',
        }}>
          {NAV_TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex:1, padding:'10px 4px 8px', border:'none', background:'transparent',
                cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                fontFamily:"'Nunito',sans-serif",
              }}>
              <span style={{ fontSize:20 }}>{tab.icon}</span>
              <span style={{
                fontSize:10, fontWeight:700,
                color: activeTab===tab.id
                  ? (activeTab==='rika' ? T.sci_teal : T.soc_main)
                  : (activeTab==='rika' ? T.sci_muted : T.muted),
              }}>{tab.label}</span>
              {activeTab===tab.id && (
                <div style={{ width:20, height:3, borderRadius:2, background: activeTab==='rika' ? T.sci_teal : T.soc_main }} />
              )}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
