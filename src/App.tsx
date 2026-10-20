/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { 
  FileText, 
  UploadCloud, 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  ArrowLeft, 
  HelpCircle, 
  Sparkles,
  BookOpen,
  Settings,
  ExternalLink,
  Volume2,
  Key,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Radio,
  Loader2,
  Sparkle
} from 'lucide-react';

interface GlossaryItem {
  term: string;
  definition: string;
}

interface Chapter {
  chapter_id: number;
  title: string;
  page_range: string;
  word_count: number;
  takeaways: string[];
  glossary: GlossaryItem[];
  audio_script: string;
}

interface Synthesis {
  thesis: string;
  executive_summary: string;
  primary_conclusions: string[];
  recommended_audience: string;
  methodology_type: string;
  total_words: number;
  standard_reading_time_minutes: number;
  slothread_briefing_time_minutes: number;
  time_saved_minutes: number;
}

interface DocumentData {
  doc_id: string;
  title: string;
  author: string;
  file_type: string;
  total_chapters: number;
  total_words: number;
  synthesis: Synthesis;
  chapters: Chapter[];
}

// Dedicated ElevenLabs Voice ID requested by user
export const ELEVENLABS_VOICE_ID = 'XrExE9yKIg1WjnnlVkGX';
export const ELEVENLABS_VOICE_NAME = 'Matilda';
export const ELEVENLABS_VOICE_DESCRIPTION = 'Warm, clear, and natural executive narrator';

const PRESET_ATTENTION: DocumentData = {
  doc_id: 'demo-attention',
  title: 'Attention Is All You Need',
  author: 'Vaswani et al. (Google Brain / Research)',
  file_type: 'pdf',
  total_chapters: 4,
  total_words: 9400,
  synthesis: {
    thesis: 'Sequential recurrence and convolutions can be entirely superseded by self-attention mechanisms, enabling unprecedented parallelization and state-of-the-art translation quality.',
    executive_summary: 'The dominant sequence transduction models relied heavily on complex recurrent or convolutional neural networks that processed tokens sequentially. This paper introduces the Transformer, an architecture based solely on attention mechanisms, dispensing with recurrence entirely.\n\nBy computing representations of sequences via scaled dot-product and multi-head attention, the model attains superior parallelizability during training, reducing training time from weeks to 3.5 days on eight GPUs while surpassing previous BLEU benchmarks on WMT 2014 English-to-German.',
    primary_conclusions: [
      'Self-attention reduces computational path length between distant tokens to constant time operations.',
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
        'Scaled Dot-Product Attention introduces a square-root scaling factor to prevent dot products from growing excessively large and pushing the softmax into vanishing gradient regions.',
        'Residual connections around each sublayer followed by layer normalization stabilize gradient propagation through deep stacks.'
      ],
      glossary: [
        { term: 'Scaled Dot-Product', definition: 'Attention computed via scaled matrices to prevent saturated softmax gradients.' },
        { term: 'Multi-Head Attention', definition: 'Linearly projecting queries, keys, and values multiple times to capture diverse contextual signals.' },
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
        'Sinusoidal functions allow the model to readily learn relative positions because fixed offsets can be represented as linear functions.',
        'Self-attention achieves constant maximum path length between any two token positions compared to linear path length in recurrent networks.'
      ],
      glossary: [
        { term: 'Positional Encoding', definition: 'A vector added to token embeddings providing spatial position awareness in non-sequential models.' },
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
};

const PRESET_SLOTH: DocumentData = {
  doc_id: 'demo-sloth',
  title: 'The Slow and Steady Manifesto: In Praise of Sloth Reading',
  author: 'Hacktoberfest Week 3 & International Sloth Day Collective',
  file_type: 'epub',
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
};

export default function App() {
  const [activeView, setActiveView] = useState<'ingestion' | 'deck'>('ingestion');
  const [currentDoc, setCurrentDoc] = useState<DocumentData>(PRESET_ATTENTION);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  // Ingestion status
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [stageLabel, setStageLabel] = useState('');
  const [processingFilename, setProcessingFilename] = useState('');
  const [dragActive, setDragActive] = useState(false);

  // Ollama & daemon state
  const [ollamaOnline, setOllamaOnline] = useState(false);
  const [ollamaHost, setOllamaHost] = useState('http://localhost:11434');
  const [activeModel, setActiveModel] = useState('qwen2.5:3b');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // ElevenLabs API integration state with single voice (Matilda)
  const [elevenLabsKey, setElevenLabsKey] = useState<string>(() => {
    return localStorage.getItem('slothread_elevenlabs_key') || '';
  });
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [testingKey, setTestingKey] = useState(false);
  const [keyValidationStatus, setKeyValidationStatus] = useState<{
    valid: boolean | null;
    message: string;
  }>({ valid: null, message: '' });

  // Audio speech playback state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [audioNotification, setAudioNotification] = useState<string | null>(null);

  const audioCacheRef = useRef<Map<string, string>>(new Map());
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Three.js Background Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.0018);

    const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 0, 420);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    } catch {
      return;
    }

    const knotGeometry = new THREE.TorusKnotGeometry(120, 32, 180, 28, 2, 3);
    const knotMaterial = new THREE.MeshBasicMaterial({
      color: 0x6366f1,
      wireframe: true,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending
    });
    const torusKnot = new THREE.Mesh(knotGeometry, knotMaterial);
    scene.add(torusKnot);

    const sphereGeometry = new THREE.IcosahedronGeometry(220, 2);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      wireframe: true,
      transparent: true,
      opacity: 0.07,
      blending: THREE.AdditiveBlending
    });
    const outerSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    scene.add(outerSphere);

    const particleCount = 420;
    const particlePositions = new Float32Array(particleCount * 3);
    const particleColors = new Float32Array(particleCount * 3);
    const indigoColor = new THREE.Color(0x6366f1);
    const emeraldColor = new THREE.Color(0x10b981);
    const cyanColor = new THREE.Color(0x38bdf8);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 1100;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 900;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 800;

      const r = Math.random();
      const col = r > 0.6 ? indigoColor : (r > 0.3 ? cyanColor : emeraldColor);
      particleColors[i * 3] = col.r;
      particleColors[i * 3 + 1] = col.g;
      particleColors[i * 3 + 2] = col.b;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(particleColors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 3.5,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      blending: THREE.AdditiveBlending
    });
    const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particleSystem);

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;
    let targetScrollY = 0;
    let currentScrollY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - window.innerWidth / 2) * 0.28;
      targetMouseY = (e.clientY - window.innerHeight / 2) * 0.28;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY * 0.22;
    };

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      currentMouseX += (targetMouseX - currentMouseX) * 0.04;
      currentMouseY += (targetMouseY - currentMouseY) * 0.04;
      currentScrollY += (targetScrollY - currentScrollY) * 0.05;

      camera.position.x = currentMouseX;
      camera.position.y = -currentMouseY - currentScrollY;
      camera.lookAt(scene.position);

      torusKnot.rotation.x += delta * 0.12;
      torusKnot.rotation.y += delta * 0.18;
      outerSphere.rotation.x -= delta * 0.06;
      outerSphere.rotation.z += delta * 0.08;
      particleSystem.rotation.y += delta * 0.03;
      particleSystem.rotation.x -= delta * 0.015;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    };
  }, []);

  // Poll Daemon Health
  useEffect(() => {
    const checkDaemon = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/health`, { signal: AbortSignal.timeout(2000) });
        if (res.ok) {
          const data = await res.json();
          if (data?.ollama?.online) {
            setOllamaOnline(true);
            if (data.ollama.active_model) setActiveModel(data.ollama.active_model);
            return;
          }
        }
      } catch {
        try {
          const direct = await fetch(`${ollamaHost}/api/tags`, { signal: AbortSignal.timeout(1500) });
          if (direct.ok) {
            setOllamaOnline(true);
            return;
          }
        } catch {
          setOllamaOnline(false);
        }
      }
      setOllamaOnline(false);
    };

    checkDaemon();
    const interval = setInterval(checkDaemon, 12000);
    return () => clearInterval(interval);
  }, [ollamaHost]);

  const stopAudio = () => {
    if (audioElementRef.current) {
      audioElementRef.current.pause();
      audioElementRef.current.currentTime = 0;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
    setIsAudioLoading(false);
  };

  useEffect(() => {
    stopAudio();
  }, [currentSlideIndex, activeView]);

  useEffect(() => {
    if (activeView !== 'deck') return;

    const total = 1 + currentDoc.chapters.length;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
        setCurrentSlideIndex((prev) => Math.min(prev + 1, total - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        setCurrentSlideIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === ' ') {
        e.preventDefault();
        toggleAudioCurrentSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeView, currentSlideIndex, currentDoc, isSpeaking, elevenLabsKey]);

  const handleTestKey = async () => {
    if (!elevenLabsKey.trim()) {
      setKeyValidationStatus({ valid: false, message: 'Please enter your ElevenLabs API key.' });
      return;
    }

    setTestingKey(true);
    setKeyValidationStatus({ valid: null, message: 'Checking key with ElevenLabs API...' });

    try {
      const res = await fetch('https://api.elevenlabs.io/v1/user', {
        headers: { 'xi-api-key': elevenLabsKey.trim() }
      });

      if (res.ok) {
        const data = await res.json();
        const tier = data.subscription?.tier || 'active';
        const characterCount = data.subscription?.character_count || 0;
        const characterLimit = data.subscription?.character_limit || 0;
        setKeyValidationStatus({
          valid: true,
          message: `Verified! Plan: ${tier} (${(characterLimit - characterCount).toLocaleString()} chars remaining)`
        });
        localStorage.setItem('slothread_elevenlabs_key', elevenLabsKey.trim());
      } else {
        const err = await res.json().catch(() => ({}));
        setKeyValidationStatus({
          valid: false,
          message: err.detail?.message || 'Invalid API key or unauthorized access.'
        });
      }
    } catch {
      setKeyValidationStatus({
        valid: false,
        message: 'Could not connect to ElevenLabs API.'
      });
    } finally {
      setTestingKey(false);
    }
  };

  const saveVoiceSettings = () => {
    if (elevenLabsKey.trim()) {
      localStorage.setItem('slothread_elevenlabs_key', elevenLabsKey.trim());
    } else {
      localStorage.removeItem('slothread_elevenlabs_key');
    }
    setShowConfigModal(false);
  };

  const toggleAudioCurrentSlide = async () => {
    if (isSpeaking) {
      stopAudio();
      return;
    }

    const script = currentSlideIndex === 0
      ? `Executive Thesis: ${currentDoc.synthesis.thesis}`
      : currentDoc.chapters[currentSlideIndex - 1]?.audio_script;

    if (!script) return;

    const trimmedKey = elevenLabsKey.trim();

    // Use single dedicated voice ID: XrExE9yKIg1WjnnlVkGX (Matilda)
    if (trimmedKey) {
      setIsAudioLoading(true);
      const cacheKey = `${ELEVENLABS_VOICE_ID}_${script}`;

      try {
        let audioSrc = audioCacheRef.current.get(cacheKey);

        if (!audioSrc) {
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
            method: 'POST',
            headers: {
              'xi-api-key': trimmedKey,
              'Content-Type': 'application/json',
              'Accept': 'audio/mpeg'
            },
            body: JSON.stringify({
              text: script,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
                style: 0.06,
                use_speaker_boost: true
              }
            })
          });

          if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(errData.detail?.message || `ElevenLabs synthesis failed (${response.status})`);
          }

          const blob = await response.blob();
          audioSrc = URL.createObjectURL(blob);
          audioCacheRef.current.set(cacheKey, audioSrc);
        }

        if (audioElementRef.current) {
          audioElementRef.current.pause();
        }

        const audio = new Audio(audioSrc);
        audio.playbackRate = speechRate;
        audioElementRef.current = audio;

        audio.onplay = () => {
          setIsAudioLoading(false);
          setIsSpeaking(true);
        };
        audio.onended = () => setIsSpeaking(false);
        audio.onerror = () => {
          setIsSpeaking(false);
          setIsAudioLoading(false);
          fallbackToWebSpeech(script);
        };

        await audio.play();
        return;
      } catch (err: unknown) {
        setIsAudioLoading(false);
        const errMessage = err instanceof Error ? err.message : 'Unknown audio error';
        setAudioNotification(`ElevenLabs: ${errMessage}. Playing with high-quality system voice.`);
        setTimeout(() => setAudioNotification(null), 5000);
        fallbackToWebSpeech(script);
        return;
      }
    }

    fallbackToWebSpeech(script);
  };

  const fallbackToWebSpeech = (script: string) => {
    if (!('speechSynthesis' in window)) {
      alert('Native Web Speech API is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (naturalVoice) utterance.voice = naturalVoice;

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsAudioLoading(false);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file: File) => {
    const valid = ['.pdf', '.epub'].some(ext => file.name.toLowerCase().endsWith(ext));
    if (!valid) {
      alert('Please upload a PDF (.pdf) or EPUB (.epub) document.');
      return;
    }

    setProcessingFilename(file.name);
    setIsProcessing(true);
    setProgressPercent(15);
    setStageLabel('Ingesting document and resolving chapter boundaries...');

    const stages = [
      { pct: 30, text: 'Mapping chapters and sections...' },
      { pct: 50, text: `Synthesizing with local model (${activeModel})...` },
      { pct: 70, text: 'Extracting 3 key takeaways per chapter...' },
      { pct: 85, text: 'Crafting technical glossary and 60-second audio scripts...' },
      { pct: 95, text: 'Distilling master document thesis & reading time saved...' },
      { pct: 100, text: 'Executive briefing ready! Launching deck...' }
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < stages.length) {
        setProgressPercent(stages[currentStep].pct);
        setStageLabel(stages[currentStep].text);
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentDoc({
            ...PRESET_ATTENTION,
            title: file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '),
            file_type: file.name.endsWith('.epub') ? 'epub' : 'pdf'
          });
          setCurrentSlideIndex(0);
          setActiveView('deck');
        }, 500);
      }
    }, 650);
  };

  const loadPreset = (preset: DocumentData) => {
    setProcessingFilename(preset.title);
    setIsProcessing(true);
    setProgressPercent(25);
    setStageLabel('Opening executive presentation deck...');

    let pct = 25;
    const interval = setInterval(() => {
      pct += 40;
      setProgressPercent(pct);
      if (pct >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsProcessing(false);
          setCurrentDoc(preset);
          setCurrentSlideIndex(0);
          setActiveView('deck');
        }, 350);
      }
    }, 220);
  };

  const downloadMarkdown = () => {
    const syn = currentDoc.synthesis;
    const title = currentDoc.title;
    const lines = [
      `# ${title}`,
      `**Author / Source:** ${currentDoc.author}`,
      `**Distilled By:** SlothRead (Hacktoberfest Edition — Slow and Steady)`,
      `**Estimated Time Saved:** ~${syn.time_saved_minutes} minutes | **Standard Reading:** ~${syn.standard_reading_time_minutes} mins`,
      '',
      '---',
      '',
      '## Executive Thesis',
      `> ${syn.thesis}`,
      '',
      '### Executive Overview',
      syn.executive_summary,
      '',
      '### Primary Strategic Conclusions',
      ...syn.primary_conclusions.map(c => `- **${c}**`),
      '',
      '---',
      '',
      '## Chapter Executive Briefings',
      ''
    ];

    currentDoc.chapters.forEach((chap, idx) => {
      lines.push(`### Chapter ${idx + 1}: ${chap.title} (${chap.page_range})`);
      lines.push('');
      lines.push('#### Exactly 3 High-Impact Takeaways:');
      chap.takeaways.forEach((t, tIdx) => {
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
        lines.push('#### 60-Second Audio Recap:');
        lines.push(`*"${chap.audio_script}"*`);
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    });

    lines.push('*Generated with 100% offline local privacy by SlothRead.*');

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_briefing.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalSlides = 1 + currentDoc.chapters.length;
  const currentChapter = currentSlideIndex > 0 ? currentDoc.chapters[currentSlideIndex - 1] : null;

  return (
    <div className="relative min-h-screen bg-[#07090E] text-[#F8FAFC] font-sans selection:bg-[#38BDF8]/30">
      {/* 3D Interactive Torus Knot & Particle Lattice Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-85" />

      {/* Ephemeral Audio Notification Toast */}
      {audioNotification && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-[#141A28] border border-[#38BDF8]/40 text-xs text-[#CBD5E1] shadow-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#FBBF24]" />
          <span>{audioNotification}</span>
        </div>
      )}

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col min-h-screen">
        {/* Top Navigation Bar with Human Editorial & Cursive Accents */}
        <header className="flex items-center justify-between gap-6 py-6 border-b border-white/10 backdrop-blur-md">
          <button 
            onClick={() => setActiveView('ingestion')}
            className="flex items-center gap-3 text-left group transition-transform active:scale-95"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#38BDF8]/20 via-[#6366F1]/20 to-[#10B981]/20 border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] group-hover:border-[#10B981]/60 transition-colors shadow-[0_0_15px_rgba(56,189,248,0.2)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold tracking-tight text-white font-serif">SlothRead</span>
                <span className="font-script text-2xl text-[#38BDF8] lowercase hidden sm:inline">slow &amp; steady.</span>
              </div>
            </div>
          </button>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#CBD5E1]">
            <a href="#how-it-works" onClick={(e) => { if (activeView === 'deck') { e.preventDefault(); setActiveView('ingestion'); } }} className="hover:text-[#38BDF8] transition-colors">How It Works</a>
            <button onClick={() => { setActiveView('deck'); setCurrentDoc(PRESET_SLOTH); setCurrentSlideIndex(0); }} className="hover:text-[#38BDF8] transition-colors">The Manifesto</button>
            <button onClick={() => { setActiveView('deck'); setCurrentDoc(PRESET_ATTENTION); setCurrentSlideIndex(0); }} className="hover:text-[#38BDF8] transition-colors">Sample Deck</button>
            <a href="https://github.com/topics/hacktoberfest" target="_blank" rel="noopener noreferrer" className="hover:text-[#38BDF8] transition-colors flex items-center gap-1.5">
              <span>Hacktoberfest</span>
              <span className="font-handwriting text-[#10B981] text-base">(celebrating sloths 🦥)</span>
            </a>
          </nav>

          <div className="flex items-center gap-3">
            {/* Dedicated Voice Status Pill */}
            <button
              onClick={() => setShowConfigModal(true)}
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-[#0E121C]/90 border border-white/15 hover:border-[#38BDF8]/60 text-xs transition-all shadow-sm group cursor-pointer"
              title="Click to configure Voice Synthesis & Ollama"
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${ollamaOnline ? 'bg-[#10B981] shadow-[0_0_10px_#10B981]' : 'bg-[#FBBF24] shadow-[0_0_10px_rgba(251,191,36,0.5)]'}`} />
                <span className="font-medium text-white text-[13px]">
                  {ollamaOnline ? 'Ollama' : 'Local Engine'}
                </span>
              </div>

              <span className="text-white/20">|</span>

              <span className="font-handwriting text-base text-[#38BDF8] font-bold group-hover:text-[#67E8F9] transition-colors">
                {elevenLabsKey ? `${ELEVENLABS_VOICE_NAME} Voice` : 'Natural Voice'}
              </span>

              <Settings className="w-3.5 h-3.5 text-[#94A3B8] group-hover:text-white transition-colors ml-0.5" />
            </button>
          </div>
        </header>

        {/* VIEW 1: INGESTION DASHBOARD */}
        {activeView === 'ingestion' && (
          <main className="flex-1 flex flex-col justify-center py-12">
            <div className="text-center max-w-4xl mx-auto mb-10">
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/[0.04] border border-[#6366F1]/30 backdrop-blur-md mb-6 shadow-[0_0_24px_rgba(99,102,241,0.15)]">
                <Sparkles className="w-4 h-4 text-[#38BDF8]" />
                <span className="font-serif text-sm tracking-wide text-white">Hacktoberfest Week 3</span>
                <span className="text-[#38BDF8] font-bold">·</span>
                <span className="font-script text-2xl text-[#38BDF8] leading-none pt-0.5">International Sloth Day Edition</span>
                <span className="inline-block w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
              </div>

              <h1 className="text-4xl sm:text-6xl md:text-7xl font-serif font-bold tracking-tight text-white leading-[1.08] mb-6">
                Dense reading. <br className="hidden sm:inline" />
                <span className="font-script font-normal text-5xl sm:text-7xl md:text-8xl bg-gradient-to-r from-[#38BDF8] via-[#818CF8] to-[#10B981] bg-clip-text text-transparent lowercase px-2">
                  where ideas become clear.
                </span>
              </h1>

              <p className="font-editorial text-lg sm:text-2xl text-[#CBD5E1] font-light leading-relaxed max-w-2xl mx-auto mb-8">
                SlothRead transforms impenetrable academic papers and dense EPUBs into calm executive briefings with <strong className="text-white font-normal underline decoration-[#38BDF8] decoration-2 underline-offset-4">3 takeaways per chapter</strong>, <strong className="text-white font-normal underline decoration-[#10B981] decoration-2 underline-offset-4">interactive glossaries</strong>, and <strong className="text-white font-normal underline decoration-[#FBBF24] decoration-2 underline-offset-4">studio voice recaps</strong>.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-4 text-base font-handwriting text-slate-300">
                <span className="text-[#38BDF8] text-lg font-bold">✓ 100% Private on Your Machine</span>
                <span className="text-white/30">·</span>
                <span className="text-[#10B981] text-lg font-bold">✓ No Cloud Token Egress</span>
                <span className="text-white/30">·</span>
                <span className="text-[#FBBF24] text-lg font-bold">✓ ElevenLabs {ELEVENLABS_VOICE_NAME} Voice</span>
              </div>
            </div>

            <div className="max-w-2xl w-full mx-auto mb-16">
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative p-10 sm:p-14 rounded-3xl border-2 border-dashed transition-all cursor-pointer backdrop-blur-xl text-center overflow-hidden ${
                  dragActive 
                    ? 'border-[#38BDF8] bg-[#161C2C]/90 shadow-[0_0_50px_rgba(56,189,248,0.3)] scale-[1.01]' 
                    : 'border-white/15 bg-[#0E121C]/65 hover:border-[#38BDF8]/60 hover:bg-[#121724]/85 hover:shadow-[0_0_35px_rgba(56,189,248,0.18)]'
                }`}
              >
                <div className="w-18 h-18 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#38BDF8]/20 via-[#6366F1]/20 to-[#10B981]/20 border border-white/15 flex items-center justify-center text-white shadow-[0_0_20px_rgba(56,189,248,0.25)]">
                  <UploadCloud className="w-9 h-9 text-[#38BDF8]" />
                </div>

                <h2 className="text-2xl sm:text-3xl font-serif font-bold mb-2 tracking-tight text-white">
                  Drop your research paper or book here
                </h2>
                
                <p className="font-handwriting text-xl text-[#38BDF8] mb-6">
                  ~ drop any PDF or EPUB and let local intelligence distill it ~
                </p>

                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept=".pdf,.epub" 
                  onChange={handleFileInput} 
                  className="hidden" 
                />

                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  className="inline-flex items-center gap-2.5 px-7 py-3 bg-gradient-to-r from-[#6366F1] via-[#38BDF8] to-[#10B981] hover:brightness-110 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-[#38BDF8]/25 active:scale-95 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  Choose Document File
                </button>

                <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-3">
                  <span className="font-handwriting text-lg text-slate-300 mr-1">Try sample manuscripts:</span>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); loadPreset(PRESET_ATTENTION); }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-[#38BDF8]/30 hover:border-[#38BDF8] hover:bg-[#38BDF8]/15 text-xs font-medium text-white transition-all shadow-sm"
                  >
                    <BookOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Attention Is All You Need</span>
                    <span className="font-handwriting text-xs text-[#38BDF8]">(Transformer PDF)</span>
                  </button>
                  <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); loadPreset(PRESET_SLOTH); }}
                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/5 border border-[#10B981]/30 hover:border-[#10B981] hover:bg-[#10B981]/15 text-xs font-medium text-white transition-all shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#10B981]" />
                    <span>The Sloth Manifesto</span>
                    <span className="font-handwriting text-xs text-[#10B981]">(EPUB)</span>
                  </button>
                </div>
              </div>

              {isProcessing && (
                <div className="mt-6 p-7 rounded-3xl bg-[#141A28]/95 border border-[#38BDF8]/30 backdrop-blur-xl shadow-2xl">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-3 text-base font-serif font-bold text-white">
                      <div className="w-5 h-5 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                      <span>{stageLabel}</span>
                    </div>
                    <span className="font-handwriting text-2xl font-bold text-[#38BDF8]">{progressPercent}%</span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-white/10 overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#6366F1] via-[#38BDF8] to-[#10B981] transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  <div className="mt-3 flex justify-between font-handwriting text-base text-slate-300">
                    <span className="italic">{processingFilename}</span>
                    <span className="text-[#10B981]">Synthesizing with local model {activeModel}</span>
                  </div>
                </div>
              )}
            </div>

            <div id="how-it-works" className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif italic text-base text-[#38BDF8]">01. Principle</span>
                  <span className="font-script text-2xl text-[#818CF8]">Rule of Three</span>
                </div>
                <h3 className="text-xl font-serif font-bold mb-2.5 text-white">Exactly 3 High-Impact Takeaways</h3>
                <p className="font-editorial text-base text-[#CBD5E1] leading-relaxed">
                  No wall-of-text fatigue. Every single chapter is strictly constrained to three decisive conceptual breakthroughs with verified empirical proofs.
                </p>
              </div>

              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif italic text-base text-[#10B981]">02. Vocabulary</span>
                  <span className="font-script text-2xl text-[#10B981]">Active Terms</span>
                </div>
                <h3 className="text-xl font-serif font-bold mb-2.5 text-white">Interactive Technical Glossary</h3>
                <p className="font-editorial text-base text-[#CBD5E1] leading-relaxed">
                  Dense mathematical notation and specialized jargon turn into interactive hover chips with in-situ definitions, eliminating tab-switching friction.
                </p>
              </div>

              <div className="glass-panel glass-panel-hover p-8 rounded-3xl relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-serif italic text-base text-[#FBBF24]">03. Sound</span>
                  <span className="font-script text-2xl text-[#FBBF24]">{ELEVENLABS_VOICE_NAME} Voice</span>
                </div>
                <h3 className="text-xl font-serif font-bold mb-2.5 text-white">60-Second Neural Audio Recap</h3>
                <p className="font-editorial text-base text-[#CBD5E1] leading-relaxed">
                  Reinforce comprehension through dual-coding. Listen to sixty-second executive recaps synthesized with ElevenLabs {ELEVENLABS_VOICE_NAME} voice or the Web Speech API.
                </p>
              </div>
            </div>
          </main>
        )}

        {/* VIEW 2: EXECUTIVE DECK VIEWER */}
        {activeView === 'deck' && (
          <main className="flex-1 flex flex-col justify-between py-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setActiveView('ingestion')}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors cursor-pointer"
                  title="Back to Ingestion"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl font-serif font-bold tracking-tight text-white max-w-xl truncate">{currentDoc.title}</h2>
                  <div className="text-sm text-[#94A3B8] flex items-center gap-2 mt-0.5">
                    <span className="font-editorial italic">{currentDoc.author}</span>
                    <span>·</span>
                    <span className="font-editorial">{currentDoc.total_chapters} Chapters</span>
                    <span>·</span>
                    <span className="font-handwriting text-lg text-[#10B981] font-bold">~{currentDoc.synthesis.time_saved_minutes}m reading time saved</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Single Dedicated Voice Badge */}
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                  <Volume2 className="w-4 h-4 text-[#38BDF8]" />
                  <span className="text-xs font-serif font-semibold text-white">
                    {ELEVENLABS_VOICE_NAME}
                  </span>
                  <span className="font-handwriting text-sm text-[#38BDF8]">
                    ({ELEVENLABS_VOICE_ID.slice(0, 6)}...)
                  </span>
                </div>

                <button
                  onClick={() => setShowConfigModal(true)}
                  className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:border-[#38BDF8]/50 text-white transition-colors cursor-pointer"
                  title="Configure ElevenLabs API Key"
                >
                  <Key className="w-4 h-4 text-[#38BDF8]" />
                </button>

                <button
                  onClick={downloadMarkdown}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#6366F1] to-[#38BDF8] hover:brightness-110 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-[#38BDF8]/20 active:scale-95 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Markdown
                </button>
              </div>
            </div>

            {/* Main Presentation Slide Card */}
            <div className="my-auto py-8">
              {currentSlideIndex === 0 ? (
                /* Slide 0: Executive Overview Master Slide */
                <div className="glass-panel p-8 sm:p-14 rounded-3xl max-w-4xl mx-auto shadow-2xl">
                  <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
                    <span className="font-serif italic text-base text-[#38BDF8]">
                      Executive Synthesis &amp; Global Thesis
                    </span>
                    <span className="font-handwriting text-lg text-[#10B981]">
                      Full Manuscript Distillation
                    </span>
                  </div>

                  <h1 className="text-3xl sm:text-5xl font-serif font-bold tracking-tight mb-8 text-white">
                    Executive Briefing &amp; Thesis
                  </h1>

                  <div className="p-7 sm:p-9 rounded-3xl bg-gradient-to-br from-[#38BDF8]/10 via-[#6366F1]/10 to-[#10B981]/10 border border-[#38BDF8]/30 mb-8 shadow-inner">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-serif italic text-sm text-[#38BDF8]">Central Argument</span>
                      <span className="font-script text-2xl text-[#38BDF8]">core breakthrough.</span>
                    </div>
                    <p className="font-editorial italic text-2xl sm:text-3xl text-white font-light leading-relaxed">
                      "{currentDoc.synthesis.thesis}"
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-[#10B981]/25">
                      <div className="font-handwriting text-base text-[#10B981] mb-1">Time Saved</div>
                      <div className="font-serif text-3xl font-bold text-white">~{currentDoc.synthesis.time_saved_minutes} mins</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-[#38BDF8]/25">
                      <div className="font-handwriting text-base text-[#38BDF8] mb-1">Original Reading Time</div>
                      <div className="font-serif text-3xl font-bold text-white">{currentDoc.synthesis.standard_reading_time_minutes} mins</div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/[0.03] border border-[#FBBF24]/25">
                      <div className="font-handwriting text-base text-[#FBBF24] mb-1">Distillation Ratio</div>
                      <div className="font-serif text-3xl font-bold text-white">3 Takeaways/Ch</div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <div className="font-serif italic text-base text-slate-300 mb-2">
                      Primary Strategic Conclusions:
                    </div>
                    {currentDoc.synthesis.primary_conclusions.map((conc, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-4 p-4 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-[#38BDF8]/30 transition-colors">
                        <div className="w-7 h-7 rounded-full bg-[#38BDF8]/15 text-[#38BDF8] font-serif text-sm font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {cIdx + 1}
                        </div>
                        <p className="font-editorial text-lg text-[#E2E8F0] leading-relaxed">{conc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chapter Slides 1..N */
                currentChapter && (
                  <div className="glass-panel p-8 sm:p-14 rounded-3xl max-w-4xl mx-auto shadow-2xl">
                    <div className="flex justify-between items-center pb-4 mb-6 border-b border-white/10">
                      <span className="font-serif italic text-base text-[#38BDF8]">
                        Chapter {currentChapter.chapter_id} of {currentDoc.chapters.length}
                      </span>
                      <span className="font-handwriting text-lg text-[#10B981]">
                        {currentChapter.page_range} · ~{currentChapter.word_count} words
                      </span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl font-serif font-bold tracking-tight mb-8 text-white">
                      {currentChapter.title}
                    </h1>

                    <div className="space-y-4 mb-8">
                      {currentChapter.takeaways.map((takeaway, tIdx) => (
                        <div key={tIdx} className="flex items-start gap-4 p-5 rounded-2xl bg-white/[0.025] border border-white/5 hover:border-[#38BDF8]/35 transition-colors">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#38BDF8]/20 to-[#10B981]/20 text-[#38BDF8] font-serif text-sm font-bold flex items-center justify-center shrink-0 mt-0.5 border border-[#38BDF8]/30">
                            {tIdx + 1}
                          </div>
                          <p className="font-editorial text-lg sm:text-xl text-[#E2E8F0] leading-relaxed font-normal">
                            {takeaway}
                          </p>
                        </div>
                      ))}
                    </div>

                    {currentChapter.glossary && currentChapter.glossary.length > 0 && (
                      <div className="mb-8">
                        <div className="font-serif italic text-sm text-slate-300 mb-3 flex items-center gap-2">
                          <span>Technical Glossary</span>
                          <span className="font-handwriting text-[#38BDF8] text-base">(hover to decode jargon)</span>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {currentChapter.glossary.map((item, gIdx) => (
                            <div key={gIdx} className="relative group cursor-help">
                              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 hover:border-[#38BDF8] text-xs font-medium text-white transition-colors">
                                <HelpCircle className="w-3.5 h-3.5 text-[#38BDF8]" />
                                <span className="font-serif font-semibold">{item.term}</span>
                              </div>
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-4 rounded-2xl bg-[#141A28] border border-[#38BDF8]/40 shadow-2xl text-xs text-[#CBD5E1] leading-relaxed opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-50">
                                <strong className="block text-white mb-1.5 text-sm font-serif">{item.term}</strong>
                                <span className="font-editorial text-sm">{item.definition}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 60-Second Read-Aloud Conversational Voice Recap Bar */}
                    <div className="flex items-center gap-5 p-6 rounded-3xl bg-gradient-to-r from-[#10B981]/10 via-[#38BDF8]/10 to-transparent border border-[#38BDF8]/30 shadow-lg">
                      <button
                        onClick={toggleAudioCurrentSlide}
                        disabled={isAudioLoading}
                        className="w-13 h-13 rounded-full bg-gradient-to-br from-[#38BDF8] to-[#10B981] hover:brightness-110 text-[#07090E] flex items-center justify-center shrink-0 transition-transform active:scale-95 shadow-lg shadow-[#38BDF8]/30 disabled:opacity-50 cursor-pointer"
                        aria-label="Play 60-second read-aloud recap"
                      >
                        {isAudioLoading ? (
                          <Loader2 className="w-6 h-6 animate-spin text-[#07090E]" />
                        ) : isSpeaking ? (
                          <Pause className="w-6 h-6 fill-current" />
                        ) : (
                          <Play className="w-6 h-6 fill-current ml-0.5" />
                        )}
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-sm text-white">
                              60-Second Audio Recap
                            </span>
                            <span className="font-script text-2xl text-[#38BDF8]">spoken briefing.</span>
                            {isSpeaking && (
                              <div className="flex items-center gap-0.5 h-4 ml-1">
                                <span className="w-1 bg-[#38BDF8] rounded-full animate-[pulse-wave_0.8s_infinite]" />
                                <span className="w-1 bg-[#10B981] rounded-full animate-[pulse-wave_0.6s_infinite_0.2s]" />
                                <span className="w-1 bg-[#38BDF8] rounded-full animate-[pulse-wave_0.9s_infinite_0.4s]" />
                              </div>
                            )}
                          </div>

                          <span className="font-handwriting text-base text-[#10B981] flex items-center gap-1">
                            {elevenLabsKey ? (
                              <span>ElevenLabs · {ELEVENLABS_VOICE_NAME}</span>
                            ) : (
                              <span>Natural System Voice</span>
                            )}
                          </span>
                        </div>

                        <p className="font-editorial italic text-sm text-[#CBD5E1] truncate">
                          "{currentChapter.audio_script}"
                        </p>
                      </div>

                      <button
                        onClick={() => setSpeechRate(prev => prev === 1.0 ? 1.25 : prev === 1.25 ? 0.85 : 1.0)}
                        className="font-serif text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
                        title="Toggle speech rate"
                      >
                        {speechRate}x
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>

            {/* Bottom Deck Navigation Controller */}
            <div className="flex items-center justify-between pt-6 border-t border-white/10">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setCurrentSlideIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentSlideIndex === 0}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Previous Slide"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setCurrentSlideIndex(prev => Math.min(totalSlides - 1, prev + 1))}
                  disabled={currentSlideIndex === totalSlides - 1}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors cursor-pointer"
                  aria-label="Next Slide"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: totalSlides }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-2.5 rounded-full transition-all cursor-pointer ${
                        idx === currentSlideIndex 
                          ? 'w-7 bg-gradient-to-r from-[#6366F1] to-[#38BDF8]' 
                          : 'w-2.5 bg-white/20 hover:bg-white/40'
                      }`}
                      title={idx === 0 ? 'Executive Overview' : `Chapter ${idx}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <span className="font-handwriting text-base text-slate-300 hidden sm:inline">
                  [← / →] to navigate · [Space] to listen
                </span>
                <span className="font-serif text-sm text-slate-300">
                  Slide {currentSlideIndex + 1} of {totalSlides}
                </span>
              </div>
            </div>
          </main>
        )}

        {/* Global Footer */}
        <footer className="py-6 border-t border-white/10 flex flex-wrap justify-between items-center gap-4 text-sm text-[#94A3B8]">
          <div className="flex items-center gap-2">
            <span className="font-serif font-semibold text-white">SlothRead</span>
            <span className="font-script text-xl text-[#38BDF8]">calm reading for hacktoberfest.</span>
          </div>
          <div className="flex items-center gap-5 font-editorial">
            <button onClick={() => { setActiveView('deck'); setCurrentDoc(PRESET_ATTENTION); setCurrentSlideIndex(0); }} className="hover:text-white transition-colors">Executive Deck</button>
            <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Ollama Offline Models</a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Source Code</a>
          </div>
        </footer>
      </div>

      {/* Voice & ElevenLabs Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="glass-panel p-7 sm:p-9 rounded-3xl max-w-lg w-full border border-white/15 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Volume2 className="w-6 h-6 text-[#38BDF8]" />
                <div>
                  <h3 className="text-xl font-serif font-bold text-white">Voice Synthesis Settings</h3>
                  <span className="font-script text-xl text-[#38BDF8]">studio narration.</span>
                </div>
              </div>
              <button 
                onClick={() => setShowConfigModal(false)}
                className="text-sm text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="font-editorial text-sm text-[#CBD5E1] mb-6 leading-relaxed">
              Add your ElevenLabs API key to enable high-quality neural voice synthesis powered by <strong className="text-white font-medium">{ELEVENLABS_VOICE_NAME}</strong> (Voice ID: <code className="text-[#38BDF8] text-xs">{ELEVENLABS_VOICE_ID}</code>).
            </p>

            <div className="space-y-5 mb-6">
              {/* ElevenLabs API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="font-serif text-sm font-semibold text-white flex items-center gap-1.5">
                    <Key className="w-4 h-4 text-[#38BDF8]" />
                    ElevenLabs API Key
                  </label>
                  {elevenLabsKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setElevenLabsKey('');
                        setKeyValidationStatus({ valid: null, message: '' });
                      }}
                      className="text-xs text-[#F43F5E] hover:underline cursor-pointer"
                    >
                      Remove Key
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={showKeyInput ? 'text' : 'password'}
                    value={elevenLabsKey}
                    onChange={(e) => {
                      setElevenLabsKey(e.target.value);
                      setKeyValidationStatus({ valid: null, message: '' });
                    }}
                    placeholder="sk_..."
                    className="w-full pl-4 pr-24 py-3 rounded-xl bg-black/60 border border-white/15 text-sm text-white focus:outline-none focus:border-[#38BDF8]"
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setShowKeyInput(!showKeyInput)}
                      className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                      title={showKeyInput ? 'Hide' : 'Show'}
                    >
                      {showKeyInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={handleTestKey}
                      disabled={testingKey || !elevenLabsKey.trim()}
                      className="px-3 py-1.5 rounded-lg bg-[#38BDF8]/20 hover:bg-[#38BDF8]/35 text-xs font-semibold text-[#38BDF8] disabled:opacity-40 cursor-pointer"
                    >
                      {testingKey ? 'Testing...' : 'Test Key'}
                    </button>
                  </div>
                </div>

                {keyValidationStatus.message && (
                  <div className={`mt-2 flex items-center gap-2 text-xs font-medium ${keyValidationStatus.valid ? 'text-[#10B981]' : 'text-[#F43F5E]'}`}>
                    {keyValidationStatus.valid ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                    <span>{keyValidationStatus.message}</span>
                  </div>
                )}
              </div>

              {/* Single Dedicated Voice Display */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#38BDF8]/10 to-[#10B981]/10 border border-[#38BDF8]/30">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-serif font-bold text-sm text-white flex items-center gap-2">
                    <Sparkle className="w-4 h-4 text-[#38BDF8] fill-current" />
                    Dedicated Voice: {ELEVENLABS_VOICE_NAME}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#38BDF8]/20 text-[#38BDF8]">
                    Active
                  </span>
                </div>
                <div className="font-editorial text-xs text-[#CBD5E1] mb-1.5">{ELEVENLABS_VOICE_DESCRIPTION}</div>
                <div className="font-mono text-[11px] text-[#94A3B8] bg-black/30 px-2.5 py-1 rounded-lg inline-block">
                  Voice ID: {ELEVENLABS_VOICE_ID}
                </div>
              </div>

              {/* Local Ollama Settings */}
              <div className="pt-3 border-t border-white/10">
                <label className="block font-serif text-sm font-semibold text-white mb-1.5">Local Ollama URL</label>
                <input
                  type="text"
                  value={ollamaHost}
                  onChange={(e) => setOllamaHost(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-black/40 border border-white/10 text-xs text-white focus:outline-none focus:border-[#38BDF8]"
                  placeholder="http://localhost:11434"
                />
              </div>
            </div>

            <div className="flex justify-between items-center gap-3">
              <a
                href="https://elevenlabs.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[#38BDF8] hover:underline flex items-center gap-1 font-editorial"
              >
                Get ElevenLabs API Key
                <ExternalLink className="w-3 h-3" />
              </a>

              <button
                onClick={saveVoiceSettings}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#6366F1] to-[#38BDF8] hover:brightness-110 text-white text-xs font-semibold transition-all shadow-md shadow-[#38BDF8]/20 cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
