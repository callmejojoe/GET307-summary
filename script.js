/**
 * GET 307 — AI & ML Study Site
 * script.js — Global Animations & Quiz Engine
 *
 * WHAT THIS FILE DOES:
 * 1. Typewriter Effect    → Animates the masthead title on the homepage character-by-character
 * 2. Scroll Fade-Ins      → IntersectionObserver watches .article-card, .toc-card,
 *                           .timeline-item elements and adds .visible class when they
 *                           enter the viewport, triggering CSS transitions in style.css
 * 3. Nav Active State     → Highlights the current page link in the sticky nav bar
 * 4. Quiz Engine          → Handles all quiz interactions:
 *                           - Option selection with correct/wrong feedback
 *                           - Score calculation on submit
 *                           - Answer explanation reveal
 */

document.addEventListener('DOMContentLoaded', () => {

  /* ──────────────────────────────────────────────
     1. TYPEWRITER EFFECT
     Targets any element with id="typewriter-target"
     (used in index.html masthead title)
  ────────────────────────────────────────────── */
  const typewriterEl = document.getElementById('typewriter-target');
  if (typewriterEl) {
    const fullText = typewriterEl.dataset.text || typewriterEl.textContent;
    typewriterEl.textContent = '';
    typewriterEl.classList.add('typewriter-cursor');

    let i = 0;
    const typeSpeed = 60; // ms per character

    function typeChar() {
      if (i < fullText.length) {
        typewriterEl.textContent += fullText[i];
        i++;
        setTimeout(typeChar, typeSpeed);
      } else {
        // Remove cursor class after a short delay
        setTimeout(() => typewriterEl.classList.remove('typewriter-cursor'), 1200);
      }
    }

    // Small delay before starting typewriter
    setTimeout(typeChar, 400);
  }


  /* ──────────────────────────────────────────────
     2. SCROLL FADE-IN (IntersectionObserver)
     Watches for .article-card, .toc-card, .timeline-item
     and adds .visible when they scroll into view.
     CSS in style.css handles the actual transition.
  ────────────────────────────────────────────── */
  const fadeTargets = document.querySelectorAll(
    '.article-card, .toc-card, .timeline-item, .workflow-step-item'
  );

  if (fadeTargets.length > 0) {
    const fadeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry, idx) => {
        if (entry.isIntersecting) {
          // Stagger delay based on element index within its parent
          const siblings = Array.from(entry.target.parentElement.children);
          const siblingIdx = siblings.indexOf(entry.target);
          entry.target.style.transitionDelay = `${siblingIdx * 80}ms`;
          entry.target.classList.add('visible');
          fadeObserver.unobserve(entry.target); // Fire once only
        }
      });
    }, {
      threshold: 0.1,     // Trigger when 10% visible
      rootMargin: '0px 0px -40px 0px' // Slightly before fully in view
    });

    fadeTargets.forEach(el => fadeObserver.observe(el));
  }


  /* ──────────────────────────────────────────────
     3. NAV ACTIVE STATE
     Compares the current page URL to each nav link
     and adds class="active" to the matching anchor.
  ────────────────────────────────────────────── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.site-nav a');
  navLinks.forEach(link => {
    const linkPage = link.getAttribute('href');
    if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
      link.classList.add('active');
    }
  });


  /* ──────────────────────────────────────────────
     4. QUIZ ENGINE
     Expects this HTML structure in topic pages:
     .quiz-section
       .quiz-body
         .quiz-question[data-answer="A"]
           .q-num, .q-text
           .quiz-options > li > button[data-option="A"]
           .quiz-explanation
       button.quiz-submit-btn
       .quiz-score-panel
  ────────────────────────────────────────────── */
  const quizSection = document.querySelector('.quiz-section');

  if (quizSection) {
    const questions = quizSection.querySelectorAll('.quiz-question');
    const submitBtn = quizSection.querySelector('.quiz-submit-btn');
    const scorePanel = quizSection.querySelector('.quiz-score-panel');

    // Track selected answers: { questionIndex: selectedButton }
    const userSelections = {};

    // ── Option click handler ──
    questions.forEach((question, qIdx) => {
      const options = question.querySelectorAll('.quiz-options li button');

      options.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove previous selection highlight
          options.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          btn.style.fontWeight = '700';

          // Store selection
          userSelections[qIdx] = btn.dataset.option;

          // Visual press effect (subtle animation)
          btn.style.transform = 'scale(0.97)';
          setTimeout(() => btn.style.transform = '', 100);
        });
      });
    });

    // ── Submit / Reveal handler ──
    if (submitBtn) {
      submitBtn.addEventListener('click', () => {
        let score = 0;

        questions.forEach((question, qIdx) => {
          const correctAnswer = question.dataset.answer;
          const userAnswer    = userSelections[qIdx];
          const options       = question.querySelectorAll('.quiz-options li button');
          const explanation   = question.querySelector('.quiz-explanation');

          // Disable all buttons in this question
          options.forEach(btn => {
            btn.disabled = true;
            btn.classList.remove('selected');
            btn.style.fontWeight = '';

            if (btn.dataset.option === correctAnswer) {
              btn.classList.add('correct'); // Always reveal correct
            } else if (btn.dataset.option === userAnswer && userAnswer !== correctAnswer) {
              btn.classList.add('wrong');   // Mark wrong selection
            }
          });

          // Show explanation
          if (explanation) explanation.classList.add('visible');

          // Score
          if (userAnswer === correctAnswer) score++;
        });

        // Show score panel
        if (scorePanel) {
          const scoreNum   = scorePanel.querySelector('.score-num');
          const scoreMsg   = scorePanel.querySelector('.score-msg');
          const totalQ     = questions.length;
          const percentage = Math.round((score / totalQ) * 100);

          if (scoreNum) scoreNum.textContent = `${score} / ${totalQ}`;

          // Dynamic message based on score
          const messages = {
            100: "Full marks! You are a machine — almost literally. Outstanding work.",
            80:  "Excellent! You have a strong grasp of the material. Review the ones you missed.",
            60:  "Good effort. A few concepts need revisiting — check the explanations above.",
            40:  "Keep pushing. Re-read the topic sections and try again.",
            0:   "Don't worry — understanding takes time. Study the material and return."
          };
          const msgKey = Object.keys(messages)
            .map(Number)
            .filter(k => percentage >= k)
            .sort((a, b) => b - a)[0];

          if (scoreMsg) scoreMsg.textContent = messages[msgKey] || messages[0];
          scorePanel.classList.add('visible');

          // Scroll to score panel smoothly
          scorePanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Change submit button text
        submitBtn.textContent = 'Reset Quiz';
        submitBtn.style.background = 'var(--sepia)';
        submitBtn.style.borderColor = 'var(--sepia)';

        // Reset handler
        submitBtn.addEventListener('click', () => window.location.reload(), { once: true });
      });
    }

    // ── Hover animation on quiz option buttons (ink-press effect) ──
    const allOptionBtns = quizSection.querySelectorAll('.quiz-options li button');
    allOptionBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => {
        if (!btn.disabled) btn.style.letterSpacing = '0.01em';
      });
      btn.addEventListener('mouseleave', () => {
        if (!btn.disabled) btn.style.letterSpacing = '';
      });
    });
  }


  /* ──────────────────────────────────────────────
     5. SUBTLE PAGE ENTRANCE
     Fades in the main content block with a brief
     delay after page load — era-appropriate, gentle.
  ────────────────────────────────────────────── */
  const mainContent = document.querySelector('.container, main');
  if (mainContent) {
    mainContent.style.opacity = '0';
    mainContent.style.transition = 'opacity 0.5s ease';
    requestAnimationFrame(() => {
      setTimeout(() => { mainContent.style.opacity = '1'; }, 100);
    });
  }

});
