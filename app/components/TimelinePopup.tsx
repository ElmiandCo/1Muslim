"use client";

import { useEffect } from "react";

export type TimelineItem = {
  id: string;
  date: string;
  title: string;
  summary: string;
  detail: string;
  lens: string;
  sourceLabel: string;
  sourceUrl: string;
};

export default function TimelinePopup({
  item,
  onClose,
}: {
  item: TimelineItem | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!item) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, onClose]);

  if (!item) return null;

  return (
    <div className="timelineModal" role="dialog" aria-modal="true" aria-labelledby="timeline-modal-title" onMouseDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="timelineModalCard">
        <button className="modalClose" onClick={onClose} aria-label="Close">×</button>
        <span className="eyebrow">{item.date}</span>
        <h2 id="timeline-modal-title">{item.title}</h2>
        <p className="timelineModalLead">{item.summary}</p>
        <div className="timelineModalBody">
          <p>{item.detail}</p>
          <div className="timelineLens">
            <strong>How to read this</strong>
            <span>{item.lens}</span>
          </div>
        </div>
        <div className="timelineSource">
          <span>PRIMARY / REPUTABLE SOURCE</span>
          <a href={item.sourceUrl} target="_blank" rel="noreferrer">
            {item.sourceLabel} <span aria-hidden="true">↗</span>
          </a>
        </div>
      </div>
    </div>
  );
}
