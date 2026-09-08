"use client";

import Link from "next/link";
import { useProgress } from "./ProgressProvider";

export default function CourseOverview({ chapters }) {
  const { mastered } = useProgress();
  const domains = Array.from(new Map(chapters.map((chapter) => [chapter.domain, {
    domain: chapter.domain,
    name: chapter.domain_name,
    weight: chapter.domain_weight,
  }])).values());

  return <section>
    <div className="view-head"><div><h2>Full Security+ SY0-701 Course</h2><p>Study all five exam domains in order, or jump directly to a chapter you want to review.</p></div></div>
    <div className="domain-summary">
      {domains.map((domain) => <div className="domain-chip" key={domain.domain}>
        <strong>Domain {domain.domain}</strong>
        <span>{domain.name}</span>
        <b>{domain.weight}% of exam</b>
      </div>)}
    </div>
    {domains.map((domain) => {
      const domainChapters = chapters.filter((chapter) => chapter.domain === domain.domain);
      return <section className="domain-block" key={domain.domain}>
        <div className="domain-title">
          <div>
            <div className="eyebrow">Domain {domain.domain} · {domain.weight}% of exam</div>
            <h2>{domain.name}</h2>
          </div>
        </div>
        {domainChapters.map((chapter) => {
          const complete = chapter.lessons.filter((lesson) => lesson.keys.length && lesson.keys.every((key) => mastered.has(key))).length;
          return <section className="chapter-card" key={chapter.chapter}>
            <div className="chapter-head"><div><div className="eyebrow">Chapter {chapter.chapter}</div><h3>{chapter.name}</h3><small>{chapter.lessons.length} lessons • {chapter.instructional_count} learning sections</small></div><div>{complete}/{chapter.lessons.length} complete</div></div>
            <div className="chapter-lessons">{chapter.lessons.map((lesson) => {
              const done = lesson.keys.length && lesson.keys.every((key) => mastered.has(key));
              return <Link className="lesson-card" href={`/course/${lesson.id}`} key={lesson.id}><span className="id">{lesson.id}</span><strong>{lesson.title}</strong><small>{lesson.learningCount} learning sections • {done ? "✓ complete" : "start lesson"}</small></Link>;
            })}</div>
          </section>;
        })}
      </section>;
    })}
  </section>;
}
