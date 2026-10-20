/**
 * SlothRead — API Client Module
 * Pure ES6+ Vanilla JS client for FastAPI backend, local Ollama pipeline,
 * and ElevenLabs Neural Voice Synthesis.
 */

const SlothReadAPI = (function () {
  'use strict';

  const DEFAULT_API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:8000'
    : window.location.origin;

  let currentBaseUrl = localStorage.getItem('slothread_api_url') || DEFAULT_API_URL;

  // In-memory audio cache for ElevenLabs audio blobs
  const audioBlobCache = new Map();

  const PRESET_DOCUMENTS = {
    'demo-attention': {
      doc_id: 'demo-attention',
      title: 'Attention Is All You Need',
      author: 'Vaswani et al. (Google Brain / Research)',
      file_type: 'pdf',
      status: 'completed',
      progress_percent: 100,
      total_chapters: 4,
      total_words: 9400,
      synthesis: {
        thesis: 'Sequential recurrence and convolutions can be entirely superseded by self-attention mechanisms, enabling unprecedented parallelization and state-of-the-art translation quality.',
        executive_summary: 'The dominant sequence transduction models relied heavily on complex recurrent or convolutional neural networks that processed tokens sequentially. This paper introduces the Transformer, an architecture based solely on attention mechanisms, dispensing with recurrence entirely.\n\nBy computing representations of sequences via scaled dot-product and multi-head attention, the model attains superior parallelizability during training, reducing training time from weeks to 3.5 days on eight GPUs while surpassing previous BLEU benchmarks on WMT 2014 English-to-German.',
        primary_conclusions: [
          'Self-attention reduces computational path length between distant tokens to O(1) operations.',
          'Multi-head attention projects queries, keys, and values into multiple representation subspaces simultaneously.',
          'Positional encodings inject sequential order into non-recurrent attention matrices without recurrent latency.'
        ],
        recommended_audience: 'Machine Learning Engineers, NLP Researchers, and AI Systems Architects',
        methodology_type: 'Empirical Deep Learning Architecture & Sequence Translation',
        total_words: 9400,
        standard_reading_time_minutes: 43,
        slothread_briefing_time_minutes: 8,
        time_saved_minutes: 35
      },
      chapters: [
        {
          chapter_id: 1,
          title: 'Section 1: Background & Recurrent Bottlenecks',
          page_range: 'Pages 1 – 2',
          word_count: 1450,
          takeaways: [
            'Sequential token computation inherently limits parallelization within training examples, creating severe latency bottlenecks on modern tensor accelerators.',
            'Prior factorization techniques reduced computational cost but could not overcome fundamental serial memory dependency constraints.',
            'Attention mechanisms had previously been used only in conjunction with recurrent networks rather than as a standalone foundation.'
          ],
          glossary: [
            { term: 'Sequential Dependency', definition: 'A computing constraint where step t cannot be evaluated until step t-1 is completed.' },
            { term: 'Transduction Model', definition: 'Any model converting an input sequence into an output sequence of varying length.' }
          ],
          audio_script: 'Welcome to the briefing on chapter one. For years, natural language models were held captive by recurrent loops. Recurrent neural networks must inspect words one by one, which completely prevents GPUs from processing sequences in parallel. The authors set out to shatter this restriction by asking: what if we discard recurrence entirely and let pure attention do all the heavy lifting?'
        },
        {
          chapter_id: 2,
          title: 'Section 2: The Transformer Architecture',
          page_range: 'Pages 2 – 5',
          word_count: 2850,
          takeaways: [
            'The Transformer follows an encoder-decoder structure composed of stacked identical layers with multi-head self-attention and position-wise feed-forward sublayers.',
            'Scaled Dot-Product Attention introduces a 1/sqrt(d_k) scaling factor to prevent dot products from growing excessively large and pushing the softmax into vanishing gradient regions.',
            'Residual connections around each sublayer followed by layer normalization stabilize gradient propagation through deep stacks.'
          ],
          glossary: [
            { term: 'Scaled Dot-Product', definition: 'Attention computed as softmax((Q * K^T) / sqrt(d_k)) * V, scaled to avoid saturated softmax gradients.' },
            { term: 'Multi-Head Attention', definition: 'Linearly projecting queries, keys, and values h times with different learned projections to capture diverse contextual signals.' },
            { term: 'Layer Normalization', definition: 'Normalizing activations across feature dimensions per sample to maintain numerical stability during training.' }
          ],
          audio_script: 'In chapter two, we uncover the Transformer engine. At its core is Scaled Dot-Product Attention. When key vectors grow large, regular dot products blow up and kill your gradients. By scaling with the square root of dimension size, the math stays stable. Multi-head projections then allow the model to simultaneously focus on syntactic syntax, pronouns, and semantic context across separate heads.'
        },
        {
          chapter_id: 3,
          title: 'Section 3: Positional Encodings & Self-Attention Mechanics',
          page_range: 'Pages 5 – 7',
          word_count: 2600,
          takeaways: [
            'Because the architecture contains no recurrence or convolution, fixed sinusoidal positional encodings are injected into input embeddings to convey sequence order.',
            'Sinusoidal functions allow the model to readily learn relative positions because for any fixed offset k, PE_{pos+k} can be represented as a linear function of PE_{pos}.',
            'Self-attention achieves constant O(1) maximum path length between any two token positions compared to O(n) in RNNs and O(log_k(n)) in CNNs.'
          ],
          glossary: [
            { term: 'Positional Encoding', definition: 'A fixed or learned vector added to token embeddings providing spatial position awareness in non-sequential models.' },
            { term: 'Path Length', definition: 'The number of network layer operations required to propagate an error signal between two arbitrary positions in a sequence.' }
          ],
          audio_script: 'Chapter three addresses a critical challenge: without an RNN, how does the model know whether a word came first or last? The team engineered sinusoidal positional encodings using sine and cosine waves of varying frequencies. This embeds continuous spatial coordinates directly into the vectors, granting the network immediate spatial awareness with zero recurrent overhead.'
        },
        {
          chapter_id: 4,
          title: 'Section 4: Empirical Results & Computational Efficiency',
          page_range: 'Pages 7 – 10',
          word_count: 2500,
          takeaways: [
            'On the WMT 2014 English-to-German task, the big Transformer established a new state-of-the-art BLEU score of 28.4, outperforming ensembles by over 2.0 BLEU.',
            'Training cost was reduced to just 3.5 days on 8 P100 GPUs, a small fraction of the training budget demanded by contemporary convolutional or recurrent baselines.',
            'Ablation studies proved that 8 attention heads represent the sweet spot for balancing expressive capacity against computational latency.'
          ],
          glossary: [
            { term: 'BLEU Score', definition: 'Bilingual Evaluation Understudy metric assessing the precision of n-gram matches between machine translations and human references.' },
            { term: 'Ablation Study', definition: 'Experimental removal of individual components to isolate and quantify their specific contribution to overall performance.' }
          ],
          audio_script: 'Chapter four delivers the empirical verdict. The Transformer crushed the WMT 2014 benchmark with a 28.4 BLEU score, besting existing ensembles while consuming only a fraction of the compute time. By liberating AI from sequential loops, this paper laid the foundation for the entire modern era of large language models.'
        }
      ]
    },
    'demo-sloth': {
      doc_id: 'demo-sloth',
      title: 'The Slow and Steady Manifesto: In Praise of Sloth Reading',
      author: 'Hacktoberfest Week 3 & International Sloth Day Collective',
      file_type: 'epub',
      status: 'completed',
      progress_percent: 100,
      total_chapters: 3,
      total_words: 6200,
      synthesis: {
        thesis: 'Deliberate, structured distillation of academic literature restores intellectual autonomy by replacing cognitive fatigue and speed-skimming with calm, high-retention executive syntheses.',
        executive_summary: 'In an era of hyper-accelerated information feeds, knowledge workers suffer from chronic cognitive exhaustion. This manifesto argues for the "Sloth Principle" of knowledge consumption: moving deliberately, eliminating superficial noise, and extracting unshakeable foundational principles.\n\nBy leveraging local, private open-weight models, readers can automate the arduous extraction of takeaways and glossaries, saving hours of mechanical eye fatigue while protecting intellectual sovereignty.',
        primary_conclusions: [
          'Speed-reading skims sacrifice 80% of critical technical nuance and formula comprehension.',
          'Constraining synthesis to exactly 3 takeaways per chapter forces hierarchical prioritization.',
          'Local offline LLMs safeguard research confidentiality without recurring SaaS taxation.'
        ],
        recommended_audience: 'Lifelong Learners, Systems Thinkers, and Hacktoberfest Contributors',
        methodology_type: 'Philosophical & Cognitive Ergonomics Treatise',
        total_words: 6200,
        standard_reading_time_minutes: 28,
        slothread_briefing_time_minutes: 6,
        time_saved_minutes: 22
      },
      chapters: [
        {
          chapter_id: 1,
          title: 'Chapter 1: The Pathology of Academic Skimming',
          page_range: 'Pages 1 – 6',
          word_count: 2100,
          takeaways: [
            'Modern technical overload forces researchers to skim abstracts, missing subtle methodological caveats and critical negative results.',
            'Working memory degrades exponentially after 45 minutes of continuous dense reading without structured conceptual anchors.',
            'A sloth-inspired reading cadence prioritizes depth of comprehension over arbitrary page counts.'
          ],
          glossary: [
            { term: 'Cognitive Friction', definition: 'The mental resistance experienced when parsing dense jargon without immediate contextual definitions.' },
            { term: 'Selective Distillation', definition: 'Systematic extraction of core operational principles while discarding rhetorical padding.' }
          ],
          audio_script: 'Welcome to chapter one of the Sloth Manifesto. We live under a torrent of research papers, yet our retention has plummeted. When we rush through dense prose, our brain drops critical details like water through a sieve. The sloth reminds us: true speed comes from eliminating wasted motion. We digest slowly, precisely, and permanently.'
        },
        {
          chapter_id: 2,
          title: 'Chapter 2: The Tri-Takeaway Constraint & Audio Anchors',
          page_range: 'Pages 7 – 13',
          word_count: 2200,
          takeaways: [
            'Restricting section briefs to exactly three takeaways prevents cognitive dilution and forces strict editorial judgment.',
            'Multimodal auditory playback engages dual-coding memory pathways, cementing complex abstract ideas 40% faster than silent reading alone.',
            'Hover glossaries provide just-in-time jargon decoding, preventing disruptive context switching to search engines.'
          ],
          glossary: [
            { term: 'Dual-Coding Theory', definition: 'The cognitive principle that verbal and visual information are processed through distinct, complementary cognitive channels.' },
            { term: 'Just-In-Time Context', definition: 'Information presented at the exact moment of cognitive encounter to minimize attention switching.' }
          ],
          audio_script: 'Chapter two establishes the rule of three. Why three takeaways? Because cognitive science proves that three is the human threshold for immediate actionable recall. When paired with a sixty-second conversational voice summary, your brain links audio cadence to visual text, locking in understanding effortlessly.'
        },
        {
          chapter_id: 3,
          title: 'Chapter 3: The Sovereign Offline Machine',
          page_range: 'Pages 14 – 19',
          word_count: 1900,
          takeaways: [
            'Proprietary cloud summarizers compromise confidential research drafts, patent applications, and institutional data privacy.',
            'Local open-weight models running on commodity laptops via Ollama yield production-grade analytical quality with zero cloud egress.',
            'Hacktoberfest open-source innovation is catalyzed when tools remain permanently accessible, offline-capable, and cost-free.'
          ],
          glossary: [
            { term: 'Local Sovereign AI', definition: 'Running neural inference strictly on private local silicon without transmitting tokens to third-party cloud servers.' },
            { term: 'Open-Weight Model', definition: 'An artificial intelligence model whose parameters are freely published for local deployment and modification.' }
          ],
          audio_script: 'Chapter three closes with our manifesto for open innovation. Your reading list reflects the raw frontier of your thoughts. Sending private manuscripts to cloud corporate APIs is a compromise you no longer have to make. With SlothRead and Ollama, your intelligence stays on your machine: slow, steady, and sovereign.'
        }
      ]
    }
  };

  return {
    getBaseUrl: function () {
      return currentBaseUrl;
    },

    setBaseUrl: function (url) {
      currentBaseUrl = url.replace(/\/+$/, '');
      localStorage.setItem('slothread_api_url', currentBaseUrl);
    },

    checkHealth: async function () {
      try {
        const res = await fetch(`${currentBaseUrl}/api/health`, {
          method: 'GET',
          headers: { 'Accept': 'application/json' },
          signal: AbortSignal.timeout(3000)
        });
        if (res.ok) {
          return await res.json();
        }
        return { status: 'offline', ollama: { online: false } };
      } catch (err) {
        return { status: 'offline', ollama: { online: false }, error: err.message };
      }
    },

    uploadDocument: async function (file, modelName) {
      const formData = new FormData();
      formData.append('file', file);
      if (modelName) {
        formData.append('model', modelName);
      }

      const res = await fetch(`${currentBaseUrl}/api/upload`, {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || `Upload failed with HTTP status ${res.status}`);
      }

      return await res.json();
    },

    getDocument: async function (docId) {
      if (PRESET_DOCUMENTS[docId]) {
        return PRESET_DOCUMENTS[docId];
      }

      const res = await fetch(`${currentBaseUrl}/api/documents/${docId}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch document status (${res.status})`);
      }

      return await res.json();
    },

    getPresetDocument: function (presetId) {
      return PRESET_DOCUMENTS[presetId] || null;
    },

    exportMarkdownUrl: function (docId) {
      return `${currentBaseUrl}/api/documents/${docId}/export`;
    },

    // ElevenLabs High-Fidelity Audio Synthesis
    synthesizeElevenLabsAudio: async function (text, apiKey, voiceId) {
      const vId = voiceId || 'pNInz6obpgDQGcFmaJgB'; // Adam
      const cacheKey = `${vId}_${text}`;

      if (audioBlobCache.has(cacheKey)) {
        return audioBlobCache.get(cacheKey);
      }

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${vId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            use_speaker_boost: true
          }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail?.message || `ElevenLabs synthesis failed (${res.status})`);
      }

      const blob = await res.blob();
      const audioUrl = URL.createObjectURL(blob);
      audioBlobCache.set(cacheKey, audioUrl);
      return audioUrl;
    }
  };
})();
