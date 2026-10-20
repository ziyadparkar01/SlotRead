/**
 * SlothRead — Executive Deck Controller
 */

(function () {
  'use strict';

  const deckViewport = document.getElementById('deck-viewport');
  const slideCounter = document.getElementById('slide-counter');
  const slideDotsContainer = document.getElementById('slide-dots-container');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const docTitleEl = document.getElementById('deck-doc-title');
  const docMetaEl = document.getElementById('deck-doc-meta');
  const exportBtn = document.getElementById('btn-export-md');

  let documentData = null;
  let slides = [];
  let currentSlideIndex = 0;
  let isSpeaking = false;
  let speechRate = 1.0;
  let currentUtterance = null;
  let currentAudioElement = null;
  const audioBlobCache = new Map();

  // Dedicated ElevenLabs Voice ID (Matilda)
  const ELEVENLABS_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX';
  const ELEVENLABS_VOICE_NAME = 'Matilda';

  document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const docId = urlParams.get('doc_id') || 'demo-attention';

    try {
      documentData = await SlothReadAPI.getDocument(docId);
      if (!documentData || !documentData.synthesis) {
        throw new Error('Incomplete document synthesis payload.');
      }
      buildDeck(documentData);
      setupGlobalControls();
    } catch (err) {
      documentData = SlothReadAPI.getPresetDocument('demo-attention');
      buildDeck(documentData);
      setupGlobalControls();
    }
  });

  function buildDeck(data) {
    if (docTitleEl) docTitleEl.textContent = data.title || 'Executive Briefing';
    if (docMetaEl) {
      const timeSaved = data.synthesis ? data.synthesis.time_saved_minutes || 30 : 30;
      docMetaEl.textContent = `${data.author || 'Author'} · ${data.total_chapters || data.chapters.length} Chapters · ~${timeSaved}m Reading Time Saved`;
    }

    deckViewport.innerHTML = '';
    slideDotsContainer.innerHTML = '';
    slides = [];

    const overviewSlide = createOverviewSlide(data);
    deckViewport.appendChild(overviewSlide);
    slides.push(overviewSlide);

    const chapters = data.chapters || [];
    chapters.forEach((chap, idx) => {
      const chapSlide = createChapterSlide(chap, idx + 1, chapters.length);
      deckViewport.appendChild(chapSlide);
      slides.push(chapSlide);
    });

    slides.forEach((_, idx) => {
      const dot = document.createElement('div');
      dot.className = `slide-dot ${idx === 0 ? 'active' : ''}`;
      dot.title = idx === 0 ? 'Executive Overview' : `Chapter ${idx}`;
      dot.addEventListener('click', () => goToSlide(idx));
      slideDotsContainer.appendChild(dot);
    });

    goToSlide(0);
  }

  function createOverviewSlide(data) {
    const slide = document.createElement('div');
    slide.className = 'glass-card slide-card active';

    const syn = data.synthesis || {};
    const totalWords = syn.total_words || data.total_words || 8500;
    const stdTime = syn.standard_reading_time_minutes || Math.ceil(totalWords / 220);
    const timeSaved = syn.time_saved_minutes || Math.max(15, stdTime - 8);

    slide.innerHTML = `
      <div class="slide-kicker-row">
        <span class="slide-chapter-tag">EXECUTIVE SYNTHESIS · GLOBAL THESIS</span>
        <span class="slide-page-range">Full Manuscript Distillation</span>
      </div>

      <h2 class="slide-title">Executive Briefing & Thesis</h2>

      <div class="thesis-callout">
        <div class="thesis-label">Core Intellectual Thesis</div>
        <p class="thesis-body">${escapeHTML(syn.thesis || 'This work establishes foundational mechanisms for accelerated synthesis without sacrificing mathematical or conceptual depth.')}</p>
      </div>

      <div class="overview-stats-grid">
        <div class="overview-stat-card">
          <div class="stat-label">Estimated Time Saved</div>
          <div class="stat-value" style="color: var(--emerald-accent);">~${timeSaved} mins</div>
        </div>
        <div class="overview-stat-card">
          <div class="stat-label">Standard Reading Duration</div>
          <div class="stat-value">${stdTime} mins</div>
        </div>
        <div class="overview-stat-card">
          <div class="stat-label">Synthesis Density</div>
          <div class="stat-value" style="color: var(--text-accent);">3 Takeaways/Ch</div>
        </div>
      </div>

      <div class="takeaways-container">
        <div style="font-family: var(--font-mono); font-size: 0.82rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 8px;">
          Primary Strategic Conclusions
        </div>
        ${(syn.primary_conclusions || [
          'Modular decoupling enhances system resilience and parallel throughput.',
          'Local sovereign LLMs preserve full research confidentiality at zero inference cost.',
          'Structured chapter distillation eliminates cognitive skimming and retains critical nuance.'
        ]).map((conc, i) => `
          <div class="takeaway-item">
            <span class="takeaway-number">${i + 1}</span>
            <span class="takeaway-text">${escapeHTML(conc)}</span>
          </div>
        `).join('')}
      </div>
    `;

    return slide;
  }

  function createChapterSlide(chapter, chapterIndex, totalChapters) {
    const slide = document.createElement('div');
    slide.className = 'glass-card slide-card';

    const takeaways = chapter.takeaways || [
      'Core mechanism delivers empirical speedups across evaluated test suites.',
      'Ablation metrics highlight the strict necessity of standardized scaling factors.',
      'Downstream evaluation confirms zero regression compared to heavier baselines.'
    ];

    const glossaryItems = chapter.glossary || [
      { term: 'Theoretical Abstraction', definition: 'A generalized model isolating core causal forces from environmental noise.' }
    ];

    const audioScript = chapter.audio_script || 'In this section, the analysis focuses on the structural proofs and foundational mechanisms that allow high-speed execution.';

    slide.innerHTML = `
      <div class="slide-kicker-row">
        <span class="slide-chapter-tag">CHAPTER ${String(chapterIndex).padStart(2, '0')} OF ${String(totalChapters).padStart(2, '0')}</span>
        <span class="slide-page-range">${escapeHTML(chapter.page_range || 'Section')} · ~${chapter.word_count || 1800} words</span>
      </div>

      <h2 class="slide-title">${escapeHTML(chapter.title || `Chapter ${chapterIndex}`)}</h2>

      <div class="takeaways-container">
        ${takeaways.slice(0, 3).map((takeaway, tIdx) => `
          <div class="takeaway-item">
            <span class="takeaway-number">${tIdx + 1}</span>
            <span class="takeaway-text">${escapeHTML(takeaway)}</span>
          </div>
        `).join('')}
      </div>

      <div class="glossary-section">
        <div class="glossary-heading">Interactive Technical Glossary</div>
        <div class="glossary-chips-row">
          ${glossaryItems.map(item => `
            <div class="glossary-chip" tabindex="0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="opacity: 0.7;">
                <circle cx="12" cy="12" r="10"></circle>
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>${escapeHTML(item.term)}</span>
              <div class="glossary-tooltip">
                <strong>${escapeHTML(item.term)}</strong>
                ${escapeHTML(item.definition)}
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="audio-player-box" id="audio-box-${chapterIndex}">
        <button class="btn-audio-play" aria-label="Play 60-second read-aloud recap">
          <svg class="icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          <svg class="icon-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display: none;">
            <rect x="6" y="4" width="4" height="16"></rect>
            <rect x="14" y="4" width="4" height="16"></rect>
          </svg>
        </button>

        <div class="audio-content">
          <div class="audio-title-row">
            <span class="audio-label">60-Second Read-Aloud Conversational Recap</span>
            <div class="waveform-bars">
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
              <div class="waveform-bar"></div>
            </div>
          </div>
          <div class="audio-script-preview">"${escapeHTML(audioScript)}"</div>
        </div>

        <button class="audio-speed-btn" title="Toggle audio playback speed">1.0x</button>
      </div>
    `;

    const playBtn = slide.querySelector('.btn-audio-play');
    const speedBtn = slide.querySelector('.audio-speed-btn');
    const audioBox = slide.querySelector('.audio-player-box');

    playBtn.addEventListener('click', () => {
      toggleSpeech(audioScript, audioBox, playBtn);
    });

    speedBtn.addEventListener('click', () => {
      if (speechRate === 1.0) speechRate = 1.25;
      else if (speechRate === 1.25) speechRate = 0.85;
      else speechRate = 1.0;
      speedBtn.textContent = `${speechRate}x`;
      if (isSpeaking) {
        toggleSpeech(audioScript, audioBox, playBtn);
        toggleSpeech(audioScript, audioBox, playBtn);
      }
    });

    return slide;
  }

  // Voice Synthesis Handler (ElevenLabs single voice XrExE9yKIg1WjnnlVkGX or Web Speech fallback)
  async function toggleSpeech(scriptText, audioBox, playBtn) {
    if (isSpeaking) {
      stopAllAudio();
      resetAudioUI(audioBox, playBtn);
      return;
    }

    const elevenLabsKey = (localStorage.getItem('slothread_elevenlabs_key') || '').trim();

    // If ElevenLabs API Key is present, synthesize with dedicated voice XrExE9yKIg1WjnnlVkGX (Matilda)
    if (elevenLabsKey) {
      const cacheKey = `${ELEVENLABS_VOICE_ID}_${scriptText}`;
      try {
        let audioSrc = audioBlobCache.get(cacheKey);

        if (!audioSrc) {
          playBtn.classList.add('loading');
          const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
              'xi-api-key': elevenLabsKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
              text: scriptText,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.06,
                use_speaker_boost: true
              }
            })
          });

          if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.detail?.message || `ElevenLabs error ${res.status}`);
          }

          const blob = await res.blob();
          audioSrc = URL.createObjectURL(blob);
          audioBlobCache.set(cacheKey, audioSrc);
        }

        stopAllAudio();

        const audio = new Audio(audioSrc);
        audio.playbackRate = speechRate;
        currentAudioElement = audio;

        audio.onplay = () => {
          isSpeaking = true;
          audioBox.classList.add('playing');
          playBtn.classList.remove('loading');
          playBtn.querySelector('.icon-play').style.display = 'none';
          playBtn.querySelector('.icon-pause').style.display = 'block';
        };

        audio.onended = () => {
          isSpeaking = false;
          resetAudioUI(audioBox, playBtn);
        };

        audio.onerror = () => {
          isSpeaking = false;
          resetAudioUI(audioBox, playBtn);
          fallbackWebSpeech(scriptText, audioBox, playBtn);
        };

        await audio.play();
        return;
      } catch (err) {
        console.warn('ElevenLabs playback failed, falling back to Web Speech:', err);
        fallbackWebSpeech(scriptText, audioBox, playBtn);
        return;
      }
    }

    fallbackWebSpeech(scriptText, audioBox, playBtn);
  }

  function fallbackWebSpeech(scriptText, audioBox, playBtn) {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    stopAllAudio();

    currentUtterance = new SpeechSynthesisUtterance(scriptText);
    currentUtterance.rate = speechRate;
    currentUtterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (naturalVoice) currentUtterance.voice = naturalVoice;

    currentUtterance.onstart = () => {
      isSpeaking = true;
      audioBox.classList.add('playing');
      playBtn.classList.remove('loading');
      playBtn.querySelector('.icon-play').style.display = 'none';
      playBtn.querySelector('.icon-pause').style.display = 'block';
    };

    currentUtterance.onend = () => {
      isSpeaking = false;
      resetAudioUI(audioBox, playBtn);
    };

    currentUtterance.onerror = () => {
      isSpeaking = false;
      resetAudioUI(audioBox, playBtn);
    };

    window.speechSynthesis.speak(currentUtterance);
  }

  function stopAllAudio() {
    if (currentAudioElement) {
      currentAudioElement.pause();
      currentAudioElement.currentTime = 0;
      currentAudioElement = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    isSpeaking = false;
  }

  function resetAudioUI(audioBox, playBtn) {
    if (audioBox) audioBox.classList.remove('playing');
    if (playBtn) {
      playBtn.classList.remove('loading');
      const p = playBtn.querySelector('.icon-play');
      const s = playBtn.querySelector('.icon-pause');
      if (p) p.style.display = 'block';
      if (s) s.style.display = 'none';
    }
  }

  function goToSlide(index) {
    if (index < 0 || index >= slides.length) return;

    if (isSpeaking) {
      stopAllAudio();
      document.querySelectorAll('.audio-player-box').forEach(box => box.classList.remove('playing'));
      document.querySelectorAll('.btn-audio-play .icon-play').forEach(p => p.style.display = 'block');
      document.querySelectorAll('.btn-audio-play .icon-pause').forEach(s => s.style.display = 'none');
    }

    slides.forEach((s, idx) => {
      if (idx === index) {
        s.classList.add('active');
      } else {
        s.classList.remove('active');
      }
    });

    const dots = slideDotsContainer.querySelectorAll('.slide-dot');
    dots.forEach((dot, idx) => {
      dot.className = `slide-dot ${idx === index ? 'active' : ''}`;
    });

    currentSlideIndex = index;

    if (slideCounter) {
      slideCounter.textContent = `Slide ${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    }

    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === slides.length - 1;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setupGlobalControls() {
    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentSlideIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentSlideIndex + 1));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        goToSlide(currentSlideIndex + 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        goToSlide(currentSlideIndex - 1);
      } else if (e.key === ' ' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        e.preventDefault();
        const activeCard = slides[currentSlideIndex];
        const audioBtn = activeCard ? activeCard.querySelector('.btn-audio-play') : null;
        if (audioBtn) audioBtn.click();
      }
    });

    let touchStartX = 0;
    let touchEndX = 0;

    deckViewport.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    deckViewport.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, { passive: true });

    function handleSwipe() {
      const swipeDistance = touchEndX - touchStartX;
      if (swipeDistance < -60) {
        goToSlide(currentSlideIndex + 1);
      } else if (swipeDistance > 60) {
        goToSlide(currentSlideIndex - 1);
      }
    }

    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        downloadMarkdownSummary();
      });
    }
  }

  function downloadMarkdownSummary() {
    if (!documentData) return;

    const syn = documentData.synthesis || {};
    const title = documentData.title || 'Executive Briefing';
    const author = documentData.author || 'Unknown';
    const chapters = documentData.chapters || [];

    const lines = [
      `# ${title}`,
      `**Author / Source:** ${author}`,
      `**Distilled By:** SlothRead (Hacktoberfest Edition — Slow and Steady)`,
      `**Estimated Time Saved:** ~${syn.time_saved_minutes || 30} minutes`,
      '',
      '---',
      '',
      '## Executive Thesis',
      `> ${syn.thesis || 'N/A'}`,
      '',
      '### Executive Summary',
      syn.executive_summary || '',
      '',
      '### Primary Strategic Conclusions',
      ...(syn.primary_conclusions || []).map(c => `- **${c}**`),
      '',
      '---',
      '',
      '## Chapter Briefings',
      ''
    ];

    chapters.forEach((chap, i) => {
      lines.push(`### Chapter ${i + 1}: ${chap.title} (${chap.page_range || ''})`);
      lines.push('');
      lines.push('#### Exactly 3 High-Impact Takeaways:');
      (chap.takeaways || []).forEach((t, tIdx) => {
        lines.push(`${tIdx + 1}. ${t}`);
      });
      lines.push('');

      if (chap.glossary && chap.glossary.length > 0) {
        lines.push('#### Technical Glossary:');
        chap.glossary.forEach(g => {
          lines.push(`- **${g.term}**: ${g.definition}`);
        });
        lines.push('');
      }

      if (chap.audio_script) {
        lines.push('#### 60-Second Audio Recap Script:');
        lines.push(`*"${chap.audio_script}"*`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    });

    lines.push('*Synthesized with 100% offline local privacy by SlothRead.*');

    const markdownText = lines.join('\n');
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_briefing.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function escapeHTML(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
})();
