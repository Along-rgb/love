"use client";

import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

// Files in public/images are served at /images/.
const ASK_IMAGE = "/images/yes2.jpg";
const YES_IMAGE = "/images/yes.jpg";
const NO_IMAGES = [
  "/images/mad2.jpg",
  "/images/mad.jpg",
  "/images/mad3.jpg",
  "/images/No2.jpg",
  "/images/No.jpg",
];
const SUCCESS_TITLE = "ເຍ້! ນັດແລ້ວປະຕິບໍ່ໄດ້ເດີ້ 🎉❤️";
const SUCCESS_TEXT = "ລ້ຽງນຳເດີ້ ເດີ້ ຂອບໃຈ 💕 ";
const NO_MESSAGES = [
  "ແນ່ໃຈຫວາ? 🥺",
  "ໃຫ້ຄິດອີກເທື່ອໜື່ງ",
  "ຫຍ່າໃຈດຳຫຼາຍ 💔",
  "ກົດຜິດປຸ່ມແລ້ວ!",
  "ກົດໄປນຳກັນດຽວນີ້ 💕😘",
];
const HEARTS = ["❤️", "💕", "💖", "💗", "🎉", "✨"];

function ReactionImage({ url, emoji, alt }) {
  const [failed, setFailed] = useState(false);
  return url && !failed ? (
    <img className="gif" src={url} alt={alt} onError={() => setFailed(true)} />
  ) : (
    <div className="gif-fallback" aria-hidden="true">{emoji}</div>
  );
}

export default function Home() {
  const [accepted, setAccepted] = useState(false);
  const [moves, setMoves] = useState(0);
  const [position, setPosition] = useState(null);
  const [hearts, setHearts] = useState([]);
  const cardRef = useRef(null);
  const noRef = useRef(null);
  const yesRef = useRef(null);
  const titleRef = useRef(null);
  const image = accepted ? YES_IMAGE : moves ? NO_IMAGES[(moves - 1) % NO_IMAGES.length] : ASK_IMAGE;

  useEffect(() => {
    // Return to the normal layout if resizing would leave the button outside.
    const observer = new ResizeObserver(() => setPosition(null));
    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (accepted) titleRef.current?.focus();
  }, [accepted]);

  function runAway() {
    const previous = noRef.current.getBoundingClientRect();
    // Commit the new label before measuring its (possibly wider) button.
    flushSync(() => {
      setMoves((value) => value + 1);
      setPosition({ left: 8, top: 8 });
    });

    const card = cardRef.current;
    const button = noRef.current;
    const bounds = card.getBoundingClientRect();
    const yes = yesRef.current.getBoundingClientRect();
    const width = button.offsetWidth;
    const height = button.offsetHeight;
    const maxX = Math.max(8, card.clientWidth - width - 8);
    const maxY = Math.max(8, card.clientHeight - height - 8);
    let best = null;
    let bestDistance = -1;

    // Include the corners so a safe destination still exists if random tries miss.
    const candidates = [
      { left: 8, top: 8 }, { left: maxX, top: 8 },
      { left: 8, top: maxY }, { left: maxX, top: maxY },
      ...Array.from({ length: 30 }, () => ({
        left: 8 + Math.random() * (maxX - 8),
        top: 8 + Math.random() * (maxY - 8),
      })),
    ];
    for (const candidate of candidates) {
      const x = bounds.left + candidate.left;
      const y = bounds.top + candidate.top;
      if (x < yes.right + 8 && x + width > yes.left - 8 &&
          y < yes.bottom + 8 && y + height > yes.top - 8) continue;
      const distance = Math.hypot(x - previous.left, y - previous.top);
      if (distance > bestDistance) {
        best = candidate;
        bestDistance = distance;
      }
    }
    setPosition(best);
  }

  function accept() {
    setAccepted(true);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    setHearts(Array.from({ length: 30 }, (_, id) => ({
      id,
      emoji: HEARTS[Math.floor(Math.random() * HEARTS.length)],
      left: `${Math.random() * 100}%`,
      fontSize: `${18 + Math.random() * 24}px`,
      animationDuration: `${3 + Math.random() * 3}s`,
      animationDelay: `${Math.random() * 1.5}s`,
    })));
  }

  return (
    <>
      <main className="card" ref={cardRef}>
        <section className="card-content" key={accepted ? "yes" : "ask"}>
          <ReactionImage
            key={image}
            url={image}
            emoji={accepted ? "🥰" : "🐻"}
            alt={accepted ? "Happy cat" : moves ? "A cat asking you to reconsider" : "A hopeful little cat"}
          />
          <h1 ref={titleRef} tabIndex={-1}>
            {accepted ? SUCCESS_TITLE : "ໄປກິນເຂົ້ານຳກັນບໍ່? 🥺"}
          </h1>
          {accepted ? (
            <p className="subtext">{SUCCESS_TEXT}</p>
          ) : (
            <div className="buttons">
              <button className="btn-yes" ref={yesRef} onClick={accept}>ໄປ ❤️</button>
              {/* Reserve the original slot so Yes does not shift when No escapes. */}
              <span className="no-slot">
                <button
                  className="btn-no"
                  ref={noRef}
                  style={position ? { position: "absolute", ...position } : undefined}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") runAway();
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType !== "mouse") {
                      event.preventDefault();
                      runAway();
                    }
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    runAway();
                  }}
                >
                  {moves ? NO_MESSAGES[(moves - 1) % NO_MESSAGES.length] : "ບໍ່ໄປ 😢"}
                </button>
              </span>
            </div>
          )}
        </section>
      </main>
      <div className="celebration" aria-hidden="true">
        {hearts.map(({ id, emoji, ...style }) => (
          <span
            className="heart"
            key={id}
            style={style}
            onAnimationEnd={() => setHearts((items) => items.filter((item) => item.id !== id))}
          >{emoji}</span>
        ))}
      </div>
    </>
  );
}
