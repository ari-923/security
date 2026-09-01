"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useProgress } from "./ProgressProvider";
import AITutor from "./AITutor";

function keyFor(lessonId, n) { return `${lessonId}-${n}`; }

export default function LessonClient({ lesson, previous, next, nextPreview }) {
  const { mastered, setMastered } = useProgress();
  const learning = lesson.slides.filter((s) => s.instructional);
  const done = learning.filter((s) => mastered.has(keyFor(lesson.id, s.n))).length;
  const [tutorSection, setTutorSection] = useState(null);
  const [tutorOpen, setTutorOpen] = useState(false);

  useEffect(() => {
    if (location.hash) setTimeout(() => document.querySelector(location.hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }, []);

  const objectives = useMemo(() => learning.map((s) => s.title).filter((v, i, a) => a.indexOf(v) === i).slice(0, 7), [lesson.id]);

  function askTutor(section) { setTutorSection(section); setTutorOpen(true); }

  if (lesson.security_controls_layout) {
    return <SecurityControlsLesson
      lesson={lesson}
      previous={previous}
      next={next}
      learning={learning}
      done={done}
      mastered={mastered}
      setMastered={setMastered}
      tutorOpen={tutorOpen}
      setTutorOpen={setTutorOpen}
      tutorSection={tutorSection}
      askTutor={askTutor}
    />;
  }

  if (lesson.fundamental_topic_layout) {
    return <FundamentalTopicLesson
      lesson={lesson}
      previous={previous}
      next={next}
      learning={learning}
      done={done}
      mastered={mastered}
      setMastered={setMastered}
      tutorOpen={tutorOpen}
      setTutorOpen={setTutorOpen}
      tutorSection={tutorSection}
      askTutor={askTutor}
    />;
  }

  if (lesson.fundamental_concepts_layout) {
    return <FundamentalConceptsLesson
      lesson={lesson}
      previous={previous}
      next={next}
      learning={learning}
      done={done}
      mastered={mastered}
      setMastered={setMastered}
      tutorOpen={tutorOpen}
      setTutorOpen={setTutorOpen}
      tutorSection={tutorSection}
      askTutor={askTutor}
    />;
  }

  return <div className="lesson-page">
    <div className="crumb"><Link className="btn" href="/course">← Full Course</Link> &nbsp; Chapter {lesson.chapter}: {lesson.chapter_name}</div>
    <h2 className="lesson-title">{lesson.id} {lesson.title}</h2>
    <div className="lesson-meta"><span className="pill">{learning.length} learning sections</span><span className="pill">{done}/{learning.length} mastered</span><button className="btn ai-inline" onClick={() => { setTutorSection(null); setTutorOpen(true); }}>✦ Ask AI about this lesson</button></div>
    <div className="lesson-intro"><h3>Lesson goals</h3><p>This lesson is self-contained. Read each section, work through examples, use the exam focus to understand how CompTIA may frame the concept, and answer the knowledge check before marking the section mastered.</p>{objectives.length > 0 && <ul className="lesson-objectives">{objectives.map((x) => <li key={x}>Explain or recognize <strong>{x}</strong> in a Security+ scenario.</li>)}</ul>}<p className="course-note">Below I provided the main idea <strong>(vocab)</strong> in case you want to do any further research.</p></div>

    {lesson.slides.map((section) => section.instructional
      ? <LearningSection key={section.n} lesson={lesson} section={section} done={mastered.has(keyFor(lesson.id, section.n))} onDone={(v) => setMastered(keyFor(lesson.id, section.n), v)} onTutor={() => askTutor(section)} />
      : <TransitionSection key={section.n} lesson={lesson} section={section} nextPreview={nextPreview} />
    )}

    <LessonNav previous={previous} next={next} />
    <AITutor open={tutorOpen} onClose={() => setTutorOpen(false)} lesson={lesson} section={tutorSection} />
  </div>;
}

function SecurityControlsLesson({ lesson, previous, next, learning, done, mastered, setMastered, tutorOpen, setTutorOpen, tutorSection, askTutor }) {
  const layout = lesson.security_controls_layout;
  const sectionByTitle = Object.fromEntries(learning.map((s) => [s.title, s]));

  return <div className="lesson-page security-controls-page">
    <div className="crumb"><Link className="btn" href="/course">← Full Course</Link> &nbsp; Chapter {lesson.chapter}: {lesson.chapter_name}</div>
    <h2 className="lesson-title">{lesson.id} {lesson.title}</h2>
    <div className="lesson-meta">
      <span className="pill">{learning.length} learning sections</span>
      <span className="pill">{done}/{learning.length} mastered</span>
      <button className="btn ai-inline" onClick={() => setTutorOpen(true)}>✦ Ask AI about this lesson</button>
    </div>

    <section className="sc-hero">
      <span className="sc-kicker">Security+ Foundation</span>
      <h3>Two ways to classify security controls</h3>
      <p>{layout.intro}</p>
      <div className="sc-overview-grid">
        <div className="sc-overview-card">
          <span className="sc-label">Control Categories</span>
          <strong>HOW is the control implemented?</strong>
          <p>Technical · Managerial · Operational · Physical</p>
        </div>
        <div className="sc-overview-card">
          <span className="sc-label">Control Types</span>
          <strong>WHAT is the control trying to do?</strong>
          <p>Preventive · Deterrent · Detective · Corrective · Compensating · Directive</p>
        </div>
      </div>
    </section>

    <SecurityGroup
      eyebrow="Part 1"
      title="Control Categories"
      prompt="How is the control implemented?"
      cards={layout.categories}
      columns="four"
    />

    <ComparisonTable
      title="Quick category comparison"
      headers={["Category", "Think", "Example"]}
      rows={layout.categories.map((x) => [x.name, x.memory, x.examples.slice(0, 2).join(", ")])}
    />

    <SecurityGroup
      eyebrow="Part 2"
      title="Control Types"
      prompt="What is the control trying to do?"
      cards={layout.types}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <ComparisonTable
      title="Quick type comparison"
      headers={["Type", "Purpose", "Remember"]}
      rows={layout.types.map((x) => [x.name, x.definition, x.memory])}
    />


    {layout.classification_method && <section className="sc-section">
      <div className="sc-section-head">
        <div>
          <span className="sc-kicker">Exam Strategy</span>
          <h3>{layout.classification_method.title}</h3>
          <p>{layout.classification_method.intro}</p>
        </div>
        <span className="sc-question-badge">2 STEPS</span>
      </div>

      <div className="sc-overview-grid">
        {layout.classification_method.steps.map((step) => <div className="sc-overview-card" key={step.step}>
          <span className="sc-label">{step.step}</span>
          <strong>{step.title}</strong>
          <p><strong>{step.question}</strong></p>
          <div>
            {step.items.map(([name, meaning]) => <p key={name}><strong>{name}</strong> — {meaning}</p>)}
          </div>
        </div>)}
      </div>

      <div className="sc-example"><strong>Exam shortcut:</strong> {layout.classification_method.shortcut}</div>

      <ComparisonTable
        title="Category + type examples"
        headers={["Security control / scenario", "Category", "Type"]}
        rows={layout.classification_method.examples}
      />
    </section>}

    <aside className="sc-exam-tip">
      <span className="sc-kicker">Security+ Exam Tip</span>
      <h3>Do not mix up category and type.</h3>
      <div className="sc-tip-grid">
        <div><strong>{layout.exam_tip.category}</strong><p>Technical · Managerial · Operational · Physical</p></div>
        <div><strong>{layout.exam_tip.type}</strong><p>Preventive · Deterrent · Detective · Corrective · Compensating · Directive</p></div>
      </div>
      <div className="sc-example"><strong>Example:</strong> {layout.exam_tip.example}</div>
    </aside>

    <ExamPractice questions={layout.questions} />

    <LessonNav previous={previous} next={next} />
    <AITutor open={tutorOpen} onClose={() => setTutorOpen(false)} lesson={lesson} section={tutorSection} />
  </div>;
}



function FundamentalTopicLesson({ lesson, previous, next, learning, done, mastered, setMastered, tutorOpen, setTutorOpen, tutorSection, askTutor }) {
  const layout = lesson.fundamental_topic_layout;
  const sectionByTitle = Object.fromEntries(learning.map((s) => [s.title, s]));

  return <div className="lesson-page security-controls-page">
    <div className="crumb"><Link className="btn" href="/course">← Full Course</Link> &nbsp; Chapter {lesson.chapter}: {lesson.chapter_name}</div>
    <h2 className="lesson-title">{lesson.id} {lesson.title}</h2>
    <div className="lesson-meta">
      <span className="pill">{learning.length} learning sections</span>
      <span className="pill">{done}/{learning.length} mastered</span>
      <button className="btn ai-inline" onClick={() => { setTutorSection(null); setTutorOpen(true); }}>✦ Ask AI about this lesson</button>
    </div>

    <section className="sc-hero">
      <span className="sc-kicker">{layout.hero.kicker}</span>
      <h3>{layout.hero.title}</h3>
      <p>{layout.hero.intro}</p>
    </section>

    {layout.blocks.map((block, i) => {
      if (block.type === "group") {
        return <SecurityGroup
          key={`group-${i}`}
          eyebrow={block.eyebrow}
          title={block.title}
          prompt={block.prompt}
          badge={block.badge}
          cards={block.cards}
          columns={block.columns}
          sectionByTitle={sectionByTitle}
          lesson={lesson}
          mastered={mastered}
          setMastered={setMastered}
          askTutor={askTutor}
        />;
      }
      if (block.type === "table") {
        return <ComparisonTable key={`table-${i}`} title={block.title} headers={block.headers} rows={block.rows} />;
      }
      if (block.type === "tip") {
        return <aside className="sc-exam-tip" key={`tip-${i}`}>
          <span className="sc-kicker">{block.kicker}</span>
          <h3>{block.title}</h3>
          <div className="sc-tip-grid">
            {block.items.map((item, j) => <div key={`${item[0]}-${j}`}><strong>{item[0]}</strong><p>{item[1]}</p></div>)}
          </div>
          {block.example && <div className="sc-example">{block.example}</div>}
        </aside>;
      }
      return null;
    })}

    <ExamPractice questions={layout.questions} />
    <LessonNav previous={previous} next={next} />
    <AITutor open={tutorOpen} onClose={() => setTutorOpen(false)} lesson={lesson} section={tutorSection} />
  </div>;
}

function FundamentalConceptsLesson({ lesson, previous, next, learning, done, mastered, setMastered, tutorOpen, setTutorOpen, tutorSection, askTutor }) {
  const layout = lesson.fundamental_concepts_layout;
  const sectionByTitle = Object.fromEntries(learning.map((s) => [s.title, s]));

  return <div className="lesson-page security-controls-page">
    <div className="crumb"><Link className="btn" href="/course">← Full Course</Link> &nbsp; Chapter {lesson.chapter}: {lesson.chapter_name}</div>
    <h2 className="lesson-title">{lesson.id} {lesson.title}</h2>
    <div className="lesson-meta">
      <span className="pill">{learning.length} learning sections</span>
      <span className="pill">{done}/{learning.length} mastered</span>
      <button className="btn ai-inline" onClick={() => { setTutorSection(null); setTutorOpen(true); }}>✦ Ask AI about this lesson</button>
    </div>

    <section className="sc-hero">
      <span className="sc-kicker">Security+ Objective 1.2</span>
      <h3>Fundamental security concepts at a glance</h3>
      <p>{layout.intro}</p>
      <div className="sc-overview-grid">
        {layout.overview.map((item) => <div className="sc-overview-card" key={item.label}>
          <span className="sc-label">{item.label}</span>
          <strong>{item.question}</strong>
          <p>{item.summary}</p>
        </div>)}
      </div>
    </section>

    <SecurityGroup
      eyebrow="Part 1"
      title="CIA Triad"
      prompt="Which security goal is affected in the scenario?"
      badge="CIA"
      cards={layout.cia}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <ComparisonTable
      title="CIA scenario recognition"
      headers={["Principle", "Ask yourself", "Security+ scenario example", "Memory"]}
      rows={layout.cia.map((x) => [x.name, x.exam_question, x.scenario, x.memory])}
    />

    <SecurityGroup
      eyebrow="Part 2"
      title="AAA — Authentication, Authorization, Accounting"
      prompt="Who are you, what can you do, and what did you do?"
      badge="AAA"
      cards={layout.identity}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <ComparisonTable
      title="AAA shortcut"
      headers={["Concept", "Question to remember", "Example"]}
      rows={layout.aaa_rows}
    />

    <SecurityGroup
      eyebrow="AAA Detail"
      title="People, Systems, and Authorization Models"
      prompt="What is being authenticated, and how are permissions decided?"
      badge="ACCESS"
      cards={layout.aaa_details}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <SecurityGroup
      eyebrow="Part 3"
      title="Gap Analysis"
      prompt="Where are we now versus where should we be?"
      badge="GAP"
      cards={[layout.gap_analysis]}
      columns="one"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <ComparisonTable
      title="Gap analysis process"
      headers={["Step", "What to determine"]}
      rows={layout.gap_steps}
    />

    <SecurityGroup
      eyebrow="Part 4"
      title="Zero Trust"
      prompt="How are access decisions made, communicated, and enforced?"
      badge="VERIFY"
      cards={layout.zero_trust_core}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <SecurityGroup
      eyebrow="Zero Trust — Control Plane"
      title="Control Plane Components"
      prompt="What information and components determine the access decision?"
      badge="DECIDES"
      cards={layout.zero_trust_control_plane}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <SecurityGroup
      eyebrow="Zero Trust — Data Plane"
      title="Data Plane Components"
      prompt="Where is access used and enforced?"
      badge="ENFORCES"
      cards={layout.zero_trust_data_plane}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <aside className="sc-exam-tip">
      <span className="sc-kicker">Zero Trust Memory</span>
      <h3>How a Zero Trust access decision is made and enforced</h3>
      <div className="sc-tip-grid">
        <div><strong>Policy Engine</strong><p>Decides whether the request should be allowed.</p></div>
        <div><strong>Policy Administrator</strong><p>Acts on the decision to establish or terminate access.</p></div>
      </div>
      <div className="sc-example"><strong>Policy Enforcement Point:</strong> actually enforces the decision by allowing, denying, or terminating the connection.</div>
    </aside>

    <SecurityGroup
      eyebrow="Part 5"
      title="Physical Security"
      prompt="Which physical control best addresses the scenario?"
      badge="PHYSICAL"
      cards={layout.physical_controls}
      columns="four"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <ComparisonTable
      title="Physical security sensors"
      headers={["Sensor", "What it detects / uses", "Memory", "Scenario clue"]}
      rows={layout.sensor_rows}
    />

    <SecurityGroup
      eyebrow="Part 6"
      title="Deception, Disruption, and Assurance"
      prompt="Is the organization tricking an attacker, interrupting an attack, or proving an action?"
      badge="STRATEGY"
      cards={layout.strategies}
      columns="three"
      sectionByTitle={sectionByTitle}
      lesson={lesson}
      mastered={mastered}
      setMastered={setMastered}
      askTutor={askTutor}
    />

    <div className="sc-section" style={{ marginTop: 20 }}>
      <div className="sc-section-head">
        <div>
          <span className="sc-kicker">Deception Technology Detail</span>
          <h3>Know all four “honey” technologies</h3>
          <p>Honeypot = system · Honeynet = network · Honeyfile = file · Honeytoken = data or credential.</p>
        </div>
      </div>
    </div>

    <ComparisonTable
      title="Deception technology quick reference"
      headers={["Technology", "What is fake?", "What it does", "Memory"]}
      rows={layout.deception_rows}
    />

    <aside className="sc-exam-tip">
      <span className="sc-kicker">Security+ Exam Memory</span>
      <h3>Recognize the clue in the scenario.</h3>
      <div className="sc-tip-grid">
        <div><strong>CIA</strong><p>Exposed = Confidentiality · Changed = Integrity · Unavailable = Availability</p></div>
        <div><strong>AAA</strong><p>Who are you? = Authentication · What can you do? = Authorization · What did you do? = Accounting</p></div>
      </div>
      <div className="sc-example"><strong>Other shortcuts:</strong> Current vs. desired = Gap analysis · Can't deny it = Non-repudiation · Never trust automatically = Zero Trust · Trick = Deception · Interrupt = Disruption</div>
    </aside>

    <ExamPractice questions={layout.questions} />

    <LessonNav previous={previous} next={next} />
    <AITutor open={tutorOpen} onClose={() => setTutorOpen(false)} lesson={lesson} section={tutorSection} />
  </div>;
}

function SecurityGroup({ eyebrow, title, prompt, cards, columns, sectionByTitle, lesson, mastered, setMastered, askTutor, badge }) {
  return <section className="sc-section">
    <div className="sc-section-head">
      <div><span className="sc-kicker">{eyebrow}</span><h3>{title}</h3><p>Ask yourself: <strong>{prompt}</strong></p></div>
      <span className="sc-question-badge">{badge || (prompt.startsWith("How") ? "HOW?" : "PURPOSE?")}</span>
    </div>
    <div className={`sc-card-grid ${columns === "four" ? "sc-four" : columns === "two" ? "sc-two" : columns === "one" ? "sc-one" : "sc-three"}`}>
      {cards.map((card) => {
        const section = sectionByTitle?.[card.name];
        const isDone = section ? mastered.has(keyFor(lesson.id, section.n)) : false;
        return <article className={`sc-control-card ${isDone ? "done" : ""}`} key={card.name}>
          <h4>{card.name}</h4>
          <p className="sc-definition">{card.definition}</p>
          <div className="sc-examples"><span>Examples</span><ul>{card.examples.map((x) => <li key={x}>{x}</li>)}</ul></div>
          <div className="sc-memory">Memory: <strong>{card.memory}</strong></div>
          {section && <div className="sc-card-actions">
            <button className="understand ai-section" onClick={() => askTutor(section)}>✦ Ask AI</button>
            <button className="understand" onClick={() => setMastered(keyFor(lesson.id, section.n), !isDone)}>{isDone ? "✓ Mastered" : "Mark mastered"}</button>
          </div>}
        </article>;
      })}
    </div>
  </section>;
}

function ComparisonTable({ title, headers, rows }) {
  return <section className="sc-table-card">
    <h4>{title}</h4>
    <div className="sc-table-scroll"><table><thead><tr>{headers.map((h) => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map((row, i) => <tr key={i}>{row.map((cell, j) => <td key={j}>{cell}</td>)}</tr>)}</tbody></table></div>
  </section>;
}

function ExamPractice({ questions }) {
  const [answers, setAnswers] = useState({});

  return <section className="sc-practice">
    <span className="sc-kicker">Security+ Exam-Style Practice</span>
    <h3>Test yourself with scenario questions</h3>
    <p className="sc-muted">These are original practice questions written in the style of Security+ scenarios. They are not actual CompTIA exam questions.</p>
    <div className="sc-quiz-list">
      {questions.map((q, qi) => {
        const selected = answers[qi];
        const answered = selected !== undefined;
        return <article className="sc-quiz-card" key={qi}>
          <p className="sc-question"><span>{qi + 1}.</span> {q.q}</p>
          <div className="sc-choices">
            {q.choices.map((choice, ci) => {
              let cls = "sc-choice";
              if (answered && ci === q.answer) cls += " correct";
              if (answered && ci === selected && ci !== q.answer) cls += " wrong";
              return <button key={choice} className={cls} disabled={answered} onClick={() => setAnswers((a) => ({ ...a, [qi]: ci }))}>{String.fromCharCode(65 + ci)}. {choice}</button>;
            })}
          </div>
          {answered && <div className="sc-explanation"><strong>{selected === q.answer ? "Correct." : "Not quite."}</strong> {q.explanation}</div>}
        </article>;
      })}
    </div>
  </section>;
}

function LessonNav({ previous, next }) {
  return <div className="lesson-nav">{previous ? <Link className="btn" href={`/course/${previous.id}`}>← {previous.id} {previous.title}</Link> : <span />}{next ? <Link className="btn primary" href={`/course/${next.id}`}>{next.id} {next.title} →</Link> : <Link className="btn primary" href="/quiz">Take a scenario quiz →</Link>}</div>;
}

function LearningSection({ lesson, section, done, onDone, onTutor }) {
  const c = section.course || {};
  return <article className={`slide-card ${done ? "done" : ""}`} id={`section-${lesson.id}-${section.n}`}>
    <div className="slide-head"><div className="slide-num">{section.n}</div><div><h4>{section.title}</h4><small>Learning section</small></div><div className="slide-actions"><button className="understand ai-section" onClick={onTutor}>✦ Ask AI Tutor</button><button className="understand" onClick={() => onDone(!done)}>{done ? "✓ Mastered" : "Mark mastered"}</button></div></div>
    <div className="slide-body">
      <h5>Learn this</h5><p className="course-lead">{c.learn || section.teach}</p>
      {!!c.breakdown?.length && <div className="course-block"><h5>Break it down</h5><div className="breakdown-list">{c.breakdown.map((item, i) => <div className="breakdown-item" key={`${item.term}-${i}`}><strong>{item.term}</strong><p>{item.explanation}</p></div>)}</div></div>}
      {!!(c.defs?.length || section.defs?.length) && <div className="course-block"><h5>Key terms</h5><div className="defs">{(c.defs?.length ? c.defs : section.defs).map((d, i) => { const term = Array.isArray(d) ? d[0] : d.term; const definition = Array.isArray(d) ? d[1] : d.definition; return <div className="def" key={`${term}-${i}`}><strong>{term}</strong> — {definition}</div>; })}</div></div>}
      {c.why && <div className="course-block why"><h5>Why it matters</h5><p>{c.why}</p></div>}
      {c.example && <div className="course-block example"><h5>Example</h5><p>{c.example}</p></div>}
      {c.exam && <div className="course-block exam"><h5>Security+ exam focus</h5><p>{c.exam}</p></div>}
      {c.check_q && <details className="recall"><summary>Check your understanding</summary><p><strong>Question:</strong> {c.check_q}</p><div className="answer"><strong>Answer:</strong> {c.check_a}</div></details>}
      <details className="raw"><summary>Vocabulary</summary><pre>{section.raw}</pre></details>
    </div>
  </article>;
}

function TransitionSection({ lesson, section, nextPreview }) {
  const index = lesson.slides.findIndex((s) => s.n === section.n);
  const nearby = [];
  for (let i = index + 1; i < lesson.slides.length && nearby.length < 4; i++) {
    const next = lesson.slides[i];
    if (!next.instructional && nearby.length) break;
    if (next.instructional) nearby.push(next);
  }
  const preview = nearby.length ? nearby.map((s) => ({ title: s.title, points: s.points })) : (nextPreview?.sections || []);
  return <article className="slide-card transition-card" id={`section-${lesson.id}-${section.n}`}>
    <div className="slide-head"><div className="slide-num">{section.n}</div><div><h4>{section.title}</h4><small>What You’ll Learn</small></div></div>
    <div className="slide-body"><h5>What You’ll Learn</h5><p className="preview-intro">This section introduces <strong>{section.title}</strong>. Use the preview below to know what to focus on next.</p>{preview.length > 0 && <><h5>You’ll learn these concepts</h5><ul className="preview-focus">{preview.map((item, i) => <li key={`${item.title}-${i}`}><strong>{item.title}</strong>{item.points?.length ? ` — ${item.points.slice(0, 3).join(", ")}` : ""}</li>)}</ul></>}<div className="preview-goal"><strong>By the end:</strong> You should be able to explain <em>{section.title}</em> in your own words and connect it to the concepts that follow.</div>{section.defs?.length > 0 && <div className="defs">{section.defs.map((d, i) => <div className="def" key={i}><strong>{d[0]}</strong> — {d[1]}</div>)}</div>}<details className="raw"><summary>Vocabulary</summary><pre>{section.raw}</pre></details></div>
  </article>;
}
