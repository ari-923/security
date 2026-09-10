"use client";

import { useMemo, useState } from "react";
import { useProgress } from "./ProgressProvider";

const RECENT_KEY = "splus_practice_recent_v1";

function shuffle(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function randomizeChoices(question) {
  const choices = question.choices.map((label, originalIndex) => ({ label, originalIndex }));
  const randomized = shuffle(choices);
  return {
    ...question,
    choices: randomized.map((choice) => choice.label),
    answer: randomized.findIndex((choice) => choice.originalIndex === question.answer),
  };
}

function loadRecent(scope) {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
    return Array.isArray(saved[scope]) ? saved[scope] : [];
  } catch {
    return [];
  }
}

function saveRecent(scope, selectedIds, poolIds) {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "{}");
    const previous = Array.isArray(saved[scope]) ? saved[scope] : [];
    const pool = new Set(poolIds);
    const combined = [...new Set([...previous, ...selectedIds])].filter((id) => pool.has(id));
    saved[scope] = combined.length >= poolIds.length ? selectedIds : combined;
    localStorage.setItem(RECENT_KEY, JSON.stringify(saved));
  } catch {}
}

function pickFresh(pool, count, scope, ensureEveryChapter = false) {
  const target = Math.min(count, pool.length);
  const recent = new Set(loadRecent(scope));
  const picked = [];
  const pickedIds = new Set();

  const add = (question) => {
    if (!question || pickedIds.has(question.id) || picked.length >= target) return;
    picked.push(question);
    pickedIds.add(question.id);
  };

  if (ensureEveryChapter) {
    const byChapter = new Map();
    pool.forEach((question) => {
      if (!byChapter.has(question.chapter)) byChapter.set(question.chapter, []);
      byChapter.get(question.chapter).push(question);
    });

    [...byChapter.keys()].sort((a, b) => a - b).forEach((chapter) => {
      const chapterPool = byChapter.get(chapter);
      const unseen = chapterPool.filter((question) => !recent.has(question.id));
      add(shuffle(unseen.length ? unseen : chapterPool)[0]);
    });
  }

  const remaining = pool.filter((question) => !pickedIds.has(question.id));
  const unseen = shuffle(remaining.filter((question) => !recent.has(question.id)));
  const seen = shuffle(remaining.filter((question) => recent.has(question.id)));
  [...unseen, ...seen].forEach(add);

  const selected = shuffle(picked).map(randomizeChoices);
  saveRecent(scope, selected.map((question) => question.id), pool.map((question) => question.id));
  return selected;
}


const EXAM_DOMAIN_TARGETS = { 1: 11, 2: 20, 3: 16, 4: 25, 5: 18 };

function pickWeightedExam(pool, chapters, scope) {
  const target = Math.min(90, pool.length);
  const recent = new Set(loadRecent(scope));
  const picked = [];
  const pickedIds = new Set();
  const chapterDomain = new Map(chapters.map((chapter) => [chapter.chapter, chapter.domain]));

  const add = (question) => {
    if (!question || pickedIds.has(question.id) || picked.length >= target) return false;
    picked.push(question);
    pickedIds.add(question.id);
    return true;
  };

  Object.entries(EXAM_DOMAIN_TARGETS).forEach(([domainValue, domainTarget]) => {
    if (picked.length >= target) return;
    const domain = Number(domainValue);
    const domainPool = pool.filter((question) => chapterDomain.get(question.chapter) === domain);
    const domainChapters = chapters
      .filter((chapter) => chapter.domain === domain)
      .map((chapter) => chapter.chapter);

    // Guarantee chapter coverage first while still favoring unseen questions.
    domainChapters.forEach((chapterNumber) => {
      const chapterPool = domainPool.filter((question) => question.chapter === chapterNumber && !pickedIds.has(question.id));
      const unseen = chapterPool.filter((question) => !recent.has(question.id));
      add(shuffle(unseen.length ? unseen : chapterPool)[0]);
    });

    const alreadyInDomain = picked.filter((question) => chapterDomain.get(question.chapter) === domain).length;
    const slotsLeft = Math.max(0, Math.min(domainTarget, target) - alreadyInDomain);
    if (!slotsLeft) return;

    const remaining = domainPool.filter((question) => !pickedIds.has(question.id));
    const unseen = shuffle(remaining.filter((question) => !recent.has(question.id)));
    const seen = shuffle(remaining.filter((question) => recent.has(question.id)));
    [...unseen, ...seen].slice(0, slotsLeft).forEach(add);
  });

  // Safety fallback if a future content change leaves a domain short of its target.
  if (picked.length < target) {
    const remaining = pool.filter((question) => !pickedIds.has(question.id));
    const unseen = shuffle(remaining.filter((question) => !recent.has(question.id)));
    const seen = shuffle(remaining.filter((question) => recent.has(question.id)));
    [...unseen, ...seen].forEach(add);
  }

  const selected = shuffle(picked).map(randomizeChoices);
  saveRecent(scope, selected.map((question) => question.id), pool.map((question) => question.id));
  return selected;
}

export default function QuizClient({ questionBank, chapters }) {
  const { setBestScore } = useProgress();
  const [selectedChapters, setSelectedChapters] = useState(new Set([1]));
  const [questionCount, setQuestionCount] = useState(10);
  const [run, setRun] = useState(null);

  const counts = useMemo(() => {
    const map = new Map();
    questionBank.forEach((question) => map.set(question.chapter, (map.get(question.chapter) || 0) + 1));
    return map;
  }, [questionBank]);

  const selectedPool = useMemo(
    () => questionBank.filter((question) => selectedChapters.has(question.chapter)),
    [questionBank, selectedChapters]
  );

  function toggleChapter(chapter) {
    setSelectedChapters((current) => {
      const next = new Set(current);
      next.has(chapter) ? next.delete(chapter) : next.add(chapter);
      return next;
    });
  }

  function selectAllChapters() {
    setSelectedChapters(new Set(chapters.map((chapter) => chapter.chapter)));
  }

  function startPracticeQuiz() {
    if (!selectedPool.length) return;
    const selected = [...selectedChapters].sort((a, b) => a - b);
    const count = questionCount === "all" ? selectedPool.length : Number(questionCount);
    const scope = `quiz:${selected.join("-")}`;
    setRun({
      mode: "quiz",
      title: "Practice Quiz",
      subtitle: selected.length === 1 ? `Chapter ${selected[0]}` : `Chapters ${selected.join(", ")}`,
      questions: pickFresh(selectedPool, count, scope, false),
      index: 0,
      score: 0,
      answered: null,
    });
  }

  function startPracticeExam() {
    const scope = "exam:all-chapters";
    setRun({
      mode: "exam",
      title: "Practice Exam",
      subtitle: "All 28 chapters",
      questions: pickWeightedExam(questionBank, chapters, scope),
      index: 0,
      score: 0,
      answered: null,
    });
  }

  function restartCurrent() {
    if (!run) return;
    if (run.mode === "exam") {
      startPracticeExam();
      return;
    }
    startPracticeQuiz();
  }

  if (!run) {
    return <section>
      <div className="view-head">
        <div><h2>Practice Center</h2><p>Build a chapter practice quiz or take a comprehensive exam covering every chapter.</p></div>
      </div>

      <div className="practice-mode-grid">
        <div className="practice-config">
          <div className="eyebrow">CUSTOM PRACTICE</div>
          <h3>Practice Quiz</h3>
          <p>Choose exactly which chapters you want included. A new attempt prioritizes questions you have not just seen.</p>

          <div className="practice-toolbar">
            <strong>Select chapters</strong>
            <div>
              <button className="text-btn" type="button" onClick={selectAllChapters}>Select all</button>
              <span aria-hidden="true"> · </span>
              <button className="text-btn" type="button" onClick={() => setSelectedChapters(new Set())}>Clear</button>
            </div>
          </div>

          <div className="chapter-picker">
            {chapters.map((chapter) => <label className={`chapter-option ${selectedChapters.has(chapter.chapter) ? "selected" : ""}`} key={chapter.chapter}>
              <input type="checkbox" checked={selectedChapters.has(chapter.chapter)} onChange={() => toggleChapter(chapter.chapter)} />
              <span><strong>Chapter {chapter.chapter}</strong><small>{chapter.name}</small></span>
              <b>{counts.get(chapter.chapter) || 0}</b>
            </label>)}
          </div>

          <div className="practice-start-row">
            <label className="question-count">Questions
              <select value={questionCount} onChange={(event) => setQuestionCount(event.target.value === "all" ? "all" : Number(event.target.value))}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
                <option value={50}>50</option>
                <option value={75}>75</option>
                <option value="all">All available</option>
              </select>
            </label>
            <button className="btn primary" type="button" disabled={!selectedPool.length} onClick={startPracticeQuiz}>
              Start Practice Quiz
            </button>
          </div>
          <p className="practice-available">{selectedPool.length ? `${selectedPool.length} questions available for your selection.` : "Select at least one chapter to begin."}</p>
        </div>

        <div className="practice-config exam-config">
          <div className="eyebrow">FULL REVIEW</div>
          <h3>Practice Exam</h3>
          <p>Take a 90-question mixed exam. Every attempt includes all 28 chapters and follows the current Security+ domain weighting for a more realistic content mix.</p>
          <div className="exam-summary">
            <div><strong>28</strong><span>chapters represented</span></div>
            <div><strong>90</strong><span>questions per attempt</span></div>
            <div><strong>{questionBank.length}</strong><span>questions in the pool</span></div>
          </div>
          <p className="exam-note">Questions and answer-choice order are reshuffled on each attempt. Recent questions are avoided whenever the pool allows it. The bank uses study questions aligned to SY0-701 concepts; it does not reproduce live exam content.</p>
          <button className="btn primary exam-start" type="button" onClick={startPracticeExam}>Start Practice Exam</button>
        </div>
      </div>
    </section>;
  }

  if (run.index >= run.questions.length) {
    const pct = run.questions.length ? Math.round(run.score / run.questions.length * 100) : 0;
    setTimeout(() => setBestScore(pct), 0);
    return <section>
      <div className="view-head">
        <div><h2>{run.title}</h2><p>{run.subtitle}</p></div>
        <button className="btn" onClick={() => setRun(null)}>Practice Center</button>
      </div>
      <div className="quiz-shell">
        <div className="result">
          <div className="eyebrow">{run.mode === "exam" ? "Exam complete" : "Quiz complete"}</div>
          <div className="score">{pct}%</div>
          <p>{run.score} of {run.questions.length} correct.</p>
          <div className="controls">
            <button className="btn primary" onClick={restartCurrent}>Take a fresh {run.mode === "exam" ? "exam" : "quiz"}</button>
            <button className="btn" onClick={() => setRun(null)}>Change practice settings</button>
          </div>
        </div>
      </div>
    </section>;
  }

  const q = run.questions[run.index];

  function answer(choice) {
    if (run.answered != null) return;
    setRun((current) => ({
      ...current,
      answered: choice,
      score: current.score + (choice === q.answer ? 1 : 0),
    }));
  }

  return <section>
    <div className="view-head">
      <div><h2>{run.title}</h2><p>{run.subtitle} · randomized attempt</p></div>
      <div className="practice-head-actions">
        <button className="btn" onClick={() => setRun(null)}>Exit</button>
        <button className="btn" onClick={restartCurrent}>New attempt</button>
      </div>
    </div>
    <div className="quiz-shell">
      <div className="quiz-top">
        <span>Question {run.index + 1} of {run.questions.length}</span>
        <span>Score: {run.score}</span>
      </div>
      <div className="progress"><span style={{ width: `${run.index / run.questions.length * 100}%` }} /></div>
      <div className="quiz-chapter-tag">Chapter {q.chapter}: {q.chapterName}</div>
      <div className="quiz-q">{q.q}</div>
      <div className="choices">
        {q.choices.map((choice, i) => <button
          className={`choice ${run.answered != null && i === q.answer ? "correct" : ""} ${run.answered === i && i !== q.answer ? "wrong" : ""}`}
          disabled={run.answered != null}
          onClick={() => answer(i)}
          key={`${choice}-${i}`}
        >{String.fromCharCode(65 + i)}. {choice}</button>)}
      </div>
      {run.answered != null && <div className="explain show"><strong>{run.answered === q.answer ? "Correct." : "Not quite."}</strong> {q.why}</div>}
      {run.answered != null && <div className="quiz-next"><button className="btn primary" onClick={() => setRun((current) => ({ ...current, index: current.index + 1, answered: null }))}>{run.index + 1 === run.questions.length ? "See results" : "Next question"}</button></div>}
    </div>
  </section>;
}
