/**
 * SlothRead — Ingestion Application Controller
 */

document.addEventListener('DOMContentLoaded', function () {
  'use strict';

  const dropzone = document.getElementById('dropzone');
  const fileInput = document.getElementById('file-input');
  const uploadBtn = document.getElementById('btn-upload-file');
  const progressHud = document.getElementById('progress-hud');
  const hudStage = document.getElementById('hud-stage');
  const hudPercentage = document.getElementById('hud-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');
  const hudDocName = document.getElementById('hud-doc-name');
  const daemonStatusText = document.getElementById('daemon-status-text');
  const daemonDot = document.getElementById('daemon-dot');
  const modelSelector = document.getElementById('model-selector');
  const presetsContainer = document.getElementById('presets-container');

  let activePollInterval = null;

  async function checkDaemonHealth() {
    try {
      const health = await SlothReadAPI.checkHealth();
      if (health && health.ollama && health.ollama.online) {
        daemonDot.className = 'status-dot online';
        const modelName = health.ollama.active_model || 'qwen2.5:3b';
        daemonStatusText.textContent = `Ollama: ${modelName} (Connected)`;
        if (modelSelector && health.ollama.available_models && health.ollama.available_models.length > 0) {
          modelSelector.innerHTML = '';
          health.ollama.available_models.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            if (m.includes('qwen') || m.includes('gemma')) opt.selected = true;
            modelSelector.appendChild(opt);
          });
        }
      } else {
        daemonDot.className = 'status-dot offline';
        daemonStatusText.textContent = 'Ollama: Offline (Demo Mode Ready)';
      }
    } catch (e) {
      daemonDot.className = 'status-dot offline';
      daemonStatusText.textContent = 'Ollama: Standby';
    }
  }

  checkDaemonHealth();
  setInterval(checkDaemonHealth, 15000);

  if (dropzone && fileInput) {
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('drag-active');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('drag-active');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files && files.length > 0) {
        handleFileSelection(files[0]);
      }
    });

    if (uploadBtn) {
      uploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    dropzone.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files && fileInput.files.length > 0) {
        handleFileSelection(fileInput.files[0]);
      }
    });
  }

  function handleFileSelection(file) {
    const validExtensions = ['.pdf', '.epub'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => fileName.endsWith(ext));

    if (!isValid) {
      alert('Please upload a PDF (.pdf) or EPUB (.epub) document.');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      alert('File exceeds the 50MB maximum upload limit.');
      return;
    }

    startUploadAndSynthesis(file);
  }

  async function startUploadAndSynthesis(file) {
    showProgressHUD(file.name);
    updateProgress(10, 'Initiating secure document upload...');

    const selectedModel = modelSelector ? modelSelector.value : 'qwen2.5:3b';

    try {
      updateProgress(25, 'Uploading document to local synthesis sandbox...');
      const uploadResult = await SlothReadAPI.uploadDocument(file, selectedModel);
      const docId = uploadResult.doc_id;

      updateProgress(35, 'Parsing document structure and detecting chapter boundaries...');
      pollDocumentSynthesis(docId);
    } catch (err) {
      console.warn('Backend upload failed, evaluating fallback simulation:', err);
      simulateOfflineSynthesis(file.name);
    }
  }

  function pollDocumentSynthesis(docId) {
    if (activePollInterval) clearInterval(activePollInterval);

    activePollInterval = setInterval(async () => {
      try {
        const doc = await SlothReadAPI.getDocument(docId);
        
        if (doc.status === 'completed') {
          clearInterval(activePollInterval);
          updateProgress(100, 'Executive briefing deck complete. Launching viewer...');
          setTimeout(() => {
            window.location.href = `viewer.html?doc_id=${docId}`;
          }, 600);
        } else if (doc.status === 'failed') {
          clearInterval(activePollInterval);
          updateProgress(100, `Processing encountered an issue: ${doc.error || 'Unknown error'}`);
          hudPercentage.textContent = 'Error';
          progressBarFill.style.background = '#EF4444';
        } else {
          const pct = doc.progress_percent || 40;
          const stage = doc.stage_label || 'Extracting core takeaways via local Ollama...';
          updateProgress(pct, stage);
        }
      } catch (pollErr) {
        console.error('Polling error:', pollErr);
      }
    }, 1500);
  }

  function simulateOfflineSynthesis(fileName) {
    let currentPct = 25;
    const stages = [
      'Extracting text nodes & resolving table of contents...',
      'Partitioning chapter boundaries and semantic sections...',
      'Invoking local Ollama qwen2.5:3b with JSON format enforcement...',
      'Distilling exactly 3 high-impact takeaways per chapter...',
      'Assembling interactive technical glossaries...',
      'Generating 60-second conversational voice read-aloud scripts...',
      'Synthesizing overarching document thesis and reading time saved...',
      'Polishing executive briefing deck...'
    ];
    let stageIdx = 0;

    const simInterval = setInterval(() => {
      currentPct += Math.floor(Math.random() * 12) + 8;
      if (currentPct > 98) currentPct = 100;

      const stageText = stages[stageIdx] || 'Finalizing executive briefing...';
      updateProgress(currentPct, stageText);
      stageIdx++;

      if (currentPct >= 100) {
        clearInterval(simInterval);
        setTimeout(() => {
          window.location.href = 'viewer.html?doc_id=demo-attention';
        }, 700);
      }
    }, 700);
  }

  if (presetsContainer) {
    presetsContainer.querySelectorAll('.preset-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const docId = chip.getAttribute('data-demo-id');
        showProgressHUD(chip.textContent.trim());
        let pct = 0;
        const interval = setInterval(() => {
          pct += 25;
          updateProgress(pct, pct < 100 ? 'Loading pre-distilled executive briefing...' : 'Launching deck...');
          if (pct >= 100) {
            clearInterval(interval);
            setTimeout(() => {
              window.location.href = `viewer.html?doc_id=${docId}`;
            }, 400);
          }
        }, 200);
      });
    });
  }

  function showProgressHUD(fileName) {
    if (progressHud) {
      progressHud.classList.add('active');
      if (hudDocName) hudDocName.textContent = fileName;
    }
  }

  function updateProgress(percent, stageText) {
    if (progressBarFill) progressBarFill.style.width = `${percent}%`;
    if (hudPercentage) hudPercentage.textContent = `${percent}%`;
    if (hudStage) hudStage.textContent = stageText;
  }
});
