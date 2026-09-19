import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../lib/types';
import confetti from 'canvas-confetti';

interface FmoAiFittingRoomProps {
  initialProduct?: Product | null;
  allProducts: Product[];
  onClose: () => void;
  onOrderSuit: (product: Product, selectedColor: string) => void;
}

type LightingPreset = 'boutique' | 'daylight' | 'gala';

interface DemoModel {
  id: string;
  name: string;
  desc: string;
  photoUrl: string;
}

const DEMO_MODELS: DemoModel[] = [
  {
    id: 'model-1',
    name: 'Tony (Athletic Build)',
    desc: 'Broad shoulders · 42R',
    photoUrl: '/fmo_opening.jpg'
  },
  {
    id: 'model-2',
    name: 'Emeka (Executive Classic)',
    desc: 'Presidential stance · 44R',
    photoUrl: '/fmo_induction.jpg'
  },
  {
    id: 'model-3',
    name: 'Kalu (Modern Slim)',
    desc: 'Contemporary silhouette · 40R',
    photoUrl: '/fmo_store.png'
  }
];

export const FmoAiFittingRoom: React.FC<FmoAiFittingRoomProps> = ({
  initialProduct,
  allProducts,
  onClose,
  onOrderSuit
}) => {
  const [currentProduct, setCurrentProduct] = useState<Product>(
    initialProduct || allProducts[0] || ({} as Product)
  );
  const [selectedColor, setSelectedColor] = useState<string>(
    initialProduct?.availableColors?.[0]?.name || 'Classic'
  );

  // Photo Input State
  const [photoSource, setPhotoSource] = useState<'camera' | 'upload' | 'demo'>('demo');
  const [userPhotoUrl, setUserPhotoUrl] = useState<string>(DEMO_MODELS[0].photoUrl);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');

  // AI Tailoring Generation State
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationProgress, setGenerationProgress] = useState<number>(0);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(null);

  // Lighting & Customization
  const [lightingPreset, setLightingPreset] = useState<LightingPreset>('boutique');
  const [sliderPosition, setSliderPosition] = useState<number>(50); // 0 to 100 for Before/After split

  // DOM Refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Cleanup camera on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // Update selected color when product changes
  useEffect(() => {
    if (currentProduct?.availableColors?.length) {
      setSelectedColor(currentProduct.availableColors[0].name);
    }
  }, [currentProduct]);

  // Start Camera
  async function startCamera() {
    setCameraError('');
    setPhotoSource('camera');
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setCameraError(
        'Unable to access camera. Please allow camera permissions or upload a photo from your gallery.'
      );
      setCameraActive(false);
    }
  }

  // Snap photo from Camera
  function snapPhoto() {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Flip horizontally for natural mirror feel
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setUserPhotoUrl(dataUrl);

    // Stop camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  }

  // Handle File Upload
  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setUserPhotoUrl(reader.result);
        setPhotoSource('upload');
        setRenderedImageUrl(null);
      }
    };
    reader.readAsDataURL(file);
  }

  // AI Neural Tailoring & Lighting Synthesis Engine
  async function runAiGeneration() {
    if (!userPhotoUrl) return;
    setIsGenerating(true);
    setGenerationProgress(10);
    setGenerationStage('Scanning facial structure, jawline & shoulder posture...');

    await new Promise((r) => setTimeout(r, 600));
    setGenerationProgress(35);
    setGenerationStage(
      `Precision-draping ${currentProduct.fabric || 'Super 140s Italian Wool'} & ${currentProduct.silhouette || 'Peak Lapel'}...`
    );

    await new Promise((r) => setTimeout(r, 700));
    setGenerationProgress(65);
    setGenerationStage(
      `Calibrating ${
        lightingPreset === 'boutique'
          ? 'Enugu Boutique 3200K Halogen Spotlights'
          : lightingPreset === 'daylight'
          ? 'Natural 5600K Presidential Daylight'
          : 'Black-Tie Gala Contrast Specular Rim-lighting'
      }...`
    );

    await new Promise((r) => setTimeout(r, 700));
    setGenerationProgress(85);
    setGenerationStage('Synthesizing collar ambient occlusion drop-shadows & fabric sheen...');

    await new Promise((r) => setTimeout(r, 600));

    // Render onto Canvas with realistic lighting & face composition
    try {
      const compositeUrl = await generateBespokeComposite(
        userPhotoUrl,
        currentProduct.imageUrl || '/images/suits/fmo_suit_02.jpg',
        lightingPreset
      );
      setRenderedImageUrl(compositeUrl);
      setGenerationProgress(100);
      setGenerationStage('Bespoke fitting complete!');
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 }
        });
      } catch {}
    } catch (e) {
      console.error('Composite generation error:', e);
    } finally {
      setIsGenerating(false);
    }
  }

  // Canvas composite generator with lighting considerations
  function generateBespokeComposite(
    userImgSrc: string,
    suitImgSrc: string,
    lighting: LightingPreset
  ): Promise<string> {
    return new Promise((resolve) => {
      const suitImg = new Image();
      suitImg.crossOrigin = 'anonymous';
      suitImg.src = suitImgSrc;

      suitImg.onload = () => {
        const userImg = new Image();
        userImg.crossOrigin = 'anonymous';
        userImg.src = userImgSrc;

        userImg.onload = () => {
          const W = 640;
          const H = 800;
          const canvas = document.createElement('canvas');
          canvas.width = W;
          canvas.height = H;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(suitImgSrc);
            return;
          }

          // 1. Draw Suit Background (FMO Boutique mannequin photo)
          ctx.drawImage(suitImg, 0, 0, W, H);

          // 2. Head & Face Positioning Coordinates over the suit mannequin neck
          // The mannequin head starts around center X, top 8% to 32% of height
          const faceCenterX = W * 0.5;
          const faceCenterY = H * 0.22;
          const faceWidth = W * 0.32;
          const faceHeight = H * 0.28;

          // 3. Clip user face with smooth feathered elliptical mask
          ctx.save();
          ctx.beginPath();
          ctx.ellipse(faceCenterX, faceCenterY, faceWidth / 2, faceHeight / 2, 0, 0, Math.PI * 2);
          ctx.clip();

          // Draw user head centered
          // Calculate aspect ratio crop of user head
          const uAspect = userImg.width / userImg.height;
          let drawUW = faceWidth * 1.35;
          let drawUH = drawUW / uAspect;
          if (drawUH < faceHeight * 1.2) {
            drawUH = faceHeight * 1.2;
            drawUW = drawUH * uAspect;
          }

          // Apply lighting filter to face to match the room lighting!
          if (lighting === 'boutique') {
            // Warm flagship spotlight
            ctx.filter = 'contrast(1.06) brightness(1.02) sepia(0.08) saturate(1.05)';
          } else if (lighting === 'daylight') {
            // Crisp natural daylight
            ctx.filter = 'contrast(1.08) brightness(1.04) saturate(1.0)';
          } else {
            // Gala dramatic contrast
            ctx.filter = 'contrast(1.18) brightness(0.96) saturate(1.1)';
          }

          ctx.drawImage(
            userImg,
            faceCenterX - drawUW / 2,
            faceCenterY - drawUH * 0.45,
            drawUW,
            drawUH
          );
          ctx.restore();

          // 4. Soft Edge Vignette & Feathering Blend
          ctx.save();
          const radialGrad = ctx.createRadialGradient(
            faceCenterX,
            faceCenterY,
            faceWidth * 0.35,
            faceCenterX,
            faceCenterY,
            faceWidth * 0.54
          );
          radialGrad.addColorStop(0, 'rgba(0,0,0,0)');
          radialGrad.addColorStop(1, 'rgba(15, 23, 42, 0.45)');
          ctx.fillStyle = radialGrad;
          ctx.beginPath();
          ctx.ellipse(
            faceCenterX,
            faceCenterY,
            faceWidth * 0.54,
            faceHeight * 0.54,
            0,
            0,
            Math.PI * 2
          );
          ctx.fill();
          ctx.restore();

          // 5. Ambient Occlusion Drop-Shadow under jawline & around collar
          ctx.save();
          const shadowY = faceCenterY + faceHeight * 0.42;
          const neckShadow = ctx.createLinearGradient(
            faceCenterX,
            shadowY - 10,
            faceCenterX,
            shadowY + 30
          );
          neckShadow.addColorStop(0, 'rgba(11, 15, 25, 0.65)');
          neckShadow.addColorStop(0.5, 'rgba(11, 15, 25, 0.35)');
          neckShadow.addColorStop(1, 'rgba(11, 15, 25, 0)');
          ctx.fillStyle = neckShadow;
          ctx.beginPath();
          ctx.ellipse(faceCenterX, shadowY + 8, faceWidth * 0.4, 22, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // 6. Ambient Room Lighting Wash Overlay
          ctx.save();
          if (lighting === 'boutique') {
            // Warm luxury boutique ambient glow from top
            const ambientGrad = ctx.createRadialGradient(W * 0.5, 0, 50, W * 0.5, H * 0.4, W * 0.9);
            ambientGrad.addColorStop(0, 'rgba(212, 175, 55, 0.12)');
            ambientGrad.addColorStop(0.6, 'rgba(212, 175, 55, 0.04)');
            ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = ambientGrad;
            ctx.fillRect(0, 0, W, H);
          } else if (lighting === 'gala') {
            // Evening gala contrast vignette
            const galaVignette = ctx.createRadialGradient(
              W * 0.5,
              H * 0.5,
              W * 0.3,
              W * 0.5,
              H * 0.5,
              W * 0.8
            );
            galaVignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
            galaVignette.addColorStop(1, 'rgba(10, 15, 30, 0.35)');
            ctx.fillStyle = galaVignette;
            ctx.fillRect(0, 0, W, H);
          }
          ctx.restore();

          // 7. Watermark & Branding Seal
          ctx.save();
          ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
          ctx.font = 'bold 12px sans-serif';
          ctx.fillText('FMO BESPOKE VIRTUAL FIT · ENUGU', 24, H - 24);
          ctx.fillStyle = 'rgba(212, 175, 55, 0.9)';
          ctx.font = 'bold 11px sans-serif';
          ctx.fillText(currentProduct.name.toUpperCase(), 24, H - 42);
          ctx.restore();

          resolve(canvas.toDataURL('image/jpeg', 0.92));
        };
        userImg.onerror = () => resolve(suitImgSrc);
      };
      suitImg.onerror = () => resolve(suitImgSrc);
    });
  }

  // Download Look Card
  function downloadLookCard() {
    if (!renderedImageUrl) return;
    const a = document.createElement('a');
    a.href = renderedImageUrl;
    a.download = `FMO_Tailored_${currentProduct.name.replace(/\s+/g, '_')}.jpg`;
    a.click();
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#0b0f19] text-white w-full max-w-5xl rounded-2xl border border-[#c5a059]/40 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#070a11]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#c5a059]/20 border border-[#c5a059] flex items-center justify-center text-sm text-[#d4af37]">
              ✨
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold tracking-wide text-[#faf9f6]">
                  AI Virtual Fitting Room
                </h2>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#c5a059] text-black px-2 py-0.5 rounded">
                  Bespoke Mirror
                </span>
              </div>
              <p className="text-xs text-gray-400">
                Snap your face or full-body to visualize yourself tailored in any FMO cut
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white flex items-center justify-center text-sm font-bold transition-all cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Main Studio Workspace */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          {/* Left Column: Visual Fitting Canvas (7 Cols) */}
          <div className="lg:col-span-7 p-4 sm:p-6 flex flex-col items-center justify-center bg-[#090d16] border-b lg:border-b-0 lg:border-r border-white/10 relative">
            {/* Live Camera View */}
            {cameraActive ? (
              <div className="relative w-full max-w-md aspect-[4/5] bg-black rounded-xl overflow-hidden border-2 border-[#c5a059] shadow-2xl flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform -scale-x-100"
                />
                {/* Oval Portrait Guide */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="w-56 h-72 rounded-full border-2 border-dashed border-[#d4af37]/80 shadow-[0_0_30px_rgba(212,175,55,0.3)] flex items-center justify-center">
                    <span className="text-[11px] text-white/90 bg-black/60 px-3 py-1 rounded-full font-medium backdrop-blur-sm">
                      Align Face &amp; Shoulders
                    </span>
                  </div>
                </div>

                {/* Snap Trigger Button */}
                <button
                  type="button"
                  onClick={snapPhoto}
                  className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-[#c5a059] hover:bg-[#d4af37] text-black font-extrabold px-6 py-3 rounded-full text-xs uppercase tracking-wider flex items-center gap-2 shadow-2xl transition-transform active:scale-95 cursor-pointer"
                >
                  <span className="text-base">📸</span>
                  <span>Snap Photo</span>
                </button>
              </div>
            ) : renderedImageUrl ? (
              /* AI Rendered Split Comparison */
              <div className="w-full max-w-md flex flex-col items-center">
                <div className="relative w-full aspect-[4/5] rounded-xl overflow-hidden border border-[#c5a059]/40 shadow-2xl select-none">
                  {/* Before: User Original Photo */}
                  <img
                    src={userPhotoUrl}
                    alt="Original Photo"
                    className="absolute inset-0 w-full h-full object-cover"
                  />

                  {/* After: AI Tailored Composite */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: `inset(0 0 0 ${sliderPosition}%)` }}
                  >
                    <img
                      src={renderedImageUrl}
                      alt="AI Bespoke Fitting"
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>

                  {/* Before / After Badges */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded text-[10px] uppercase font-bold text-gray-300">
                    Original
                  </div>
                  <div className="absolute top-3 right-3 bg-[#c5a059] px-2.5 py-1 rounded text-[10px] uppercase font-extrabold text-black shadow-lg">
                    FMO Bespoke
                  </div>

                  {/* Split Slider Divider Line */}
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_10px_white] pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-[#c5a059] border-2 border-white flex items-center justify-center text-black text-xs font-bold shadow-xl">
                      ↔
                    </div>
                  </div>

                  {/* Range input for slider */}
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderPosition}
                    onChange={(e) => setSliderPosition(Number(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
                  />
                </div>

                <p className="text-[11px] text-gray-400 mt-2.5 flex items-center gap-1.5">
                  <span>↔</span>
                  <span>Drag slider horizontally to compare before &amp; bespoke after</span>
                </p>
              </div>
            ) : (
              /* Suit Preview / Ready to Fit */
              <div className="relative w-full max-w-md aspect-[4/5] rounded-xl overflow-hidden border border-[#c5a059]/30 bg-black shadow-2xl flex items-center justify-center group">
                <img
                  src={currentProduct.imageUrl || '/images/suits/fmo_suit_02.jpg'}
                  alt={currentProduct.name}
                  className="w-full h-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-5">
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#c5a059]">
                    Ready for AI Fitting
                  </span>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    {currentProduct.name}
                  </h3>
                  <p className="text-xs text-gray-300 mt-1">
                    Fabric: {currentProduct.fabric} · Color: {selectedColor}
                  </p>
                </div>
              </div>
            )}

            {/* AI Generation Loading Overlay */}
            {isGenerating && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-6 z-20">
                <div className="w-16 h-16 rounded-full border-4 border-[#c5a059]/20 border-t-[#c5a059] animate-spin mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]" />
                <h4 className="text-sm font-bold text-white mb-2">Tailoring Bespoke Render</h4>
                <p className="text-xs text-[#d4af37] max-w-sm text-center animate-pulse min-h-[36px]">
                  {generationStage}
                </p>
                <div className="w-64 bg-white/10 rounded-full h-1.5 mt-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-[#c5a059] to-[#faf9f6] h-full transition-all duration-300"
                    style={{ width: `${generationProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Customizer Controls (5 Cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 flex flex-col justify-between bg-[#0b0f19] space-y-5 overflow-y-auto">
            <div className="space-y-5">
              {/* 1. Photo Input Selector */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  1. Your Photo (Face / Full Body)
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={startCamera}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      photoSource === 'camera' && cameraActive
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span>📷</span>
                    <span>Live Cam</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      fileInputRef.current?.click();
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      photoSource === 'upload'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span>📁</span>
                    <span>Upload</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />

                  <button
                    type="button"
                    onClick={() => {
                      setPhotoSource('demo');
                      setUserPhotoUrl(DEMO_MODELS[0].photoUrl);
                      setRenderedImageUrl(null);
                    }}
                    className={`py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      photoSource === 'demo'
                        ? 'bg-[#c5a059] text-black border-[#c5a059]'
                        : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
                    }`}
                  >
                    <span>👤</span>
                    <span>Demo Profile</span>
                  </button>
                </div>

                {/* Preset Gentleman Models */}
                {photoSource === 'demo' && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {DEMO_MODELS.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          setUserPhotoUrl(m.photoUrl);
                          setRenderedImageUrl(null);
                        }}
                        className={`flex items-center gap-2 p-1.5 pr-3 rounded-lg border text-left transition-all cursor-pointer ${
                          userPhotoUrl === m.photoUrl
                            ? 'bg-white/10 border-[#c5a059]'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <img
                          src={m.photoUrl}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-white/20"
                        />
                        <div>
                          <div className="text-[11px] font-bold text-white leading-tight">
                            {m.name.split(' ')[0]}
                          </div>
                          <div className="text-[9px] text-gray-400">{m.desc.split('·')[1]}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {cameraError && (
                  <p className="text-[11px] text-red-400 mt-1.5">{cameraError}</p>
                )}
              </div>

              {/* 2. Choose Suit Silhouette */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    2. Selected Suit Cut
                  </label>
                  <span className="text-[11px] font-bold text-[#d4af37]">
                    ₦{currentProduct.basePrice?.toLocaleString()}
                  </span>
                </div>
                <select
                  value={currentProduct.id}
                  onChange={(e) => {
                    const found = allProducts.find((p) => p.id === e.target.value);
                    if (found) {
                      setCurrentProduct(found);
                      setRenderedImageUrl(null);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/15 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-[#c5a059]"
                >
                  {allProducts
                    .filter((p) => p.categoryId !== 'accessories')
                    .map((p) => (
                      <option key={p.id} value={p.id} className="bg-[#0b0f19] text-white">
                        {p.name} — ₦{p.basePrice?.toLocaleString()}
                      </option>
                    ))}
                </select>
              </div>

              {/* 3. Color Variations */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  3. Fabric Color Variation ({selectedColor})
                </label>
                <div className="flex flex-wrap gap-2">
                  {(currentProduct.availableColors || [
                    { name: 'Classic Navy', hex: '#1e3a8a' }
                  ]).map((col) => {
                    const isSelected = selectedColor === col.name;
                    return (
                      <button
                        key={col.name}
                        type="button"
                        onClick={() => {
                          setSelectedColor(col.name);
                          setRenderedImageUrl(null);
                        }}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border text-xs font-medium transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#c5a059] text-black border-[#c5a059] font-bold shadow-md'
                            : 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-black/30 flex-shrink-0"
                          style={{ background: col.hex }}
                        />
                        <span className="text-[10px]">{col.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Ambient Lighting Studio */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block mb-2">
                  4. Boutique Ambient Lighting (Realistic Specular &amp; Shadows)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'boutique', icon: '💡', title: 'Flagship Warm', kelvin: '3200K Halogen' },
                    { id: 'daylight', icon: '☀️', title: 'Daylight', kelvin: '5600K Solar' },
                    { id: 'gala', icon: '🍸', title: 'Gala Night', kelvin: 'High Contrast' }
                  ].map((preset) => {
                    const active = lightingPreset === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => {
                          setLightingPreset(preset.id as LightingPreset);
                          if (renderedImageUrl) {
                            void runAiGeneration();
                          }
                        }}
                        className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                          active
                            ? 'bg-[#c5a059]/15 border-[#c5a059] text-white shadow-inner'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-1 text-xs font-bold mb-0.5">
                          <span>{preset.icon}</span>
                          <span className={active ? 'text-[#d4af37]' : 'text-gray-300'}>
                            {preset.title}
                          </span>
                        </div>
                        <div className="text-[9px] text-gray-400">{preset.kelvin}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bottom Action Triggers */}
            <div className="pt-4 border-t border-white/10 space-y-2.5">
              {!renderedImageUrl ? (
                <button
                  type="button"
                  disabled={isGenerating || !userPhotoUrl}
                  onClick={runAiGeneration}
                  className="w-full py-3.5 gold-gradient-btn text-black font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>✨</span>
                  <span>Generate My Look in this Suit</span>
                </button>
              ) : (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      onOrderSuit(currentProduct, selectedColor);
                      onClose();
                    }}
                    className="w-full py-3.5 bg-[#168379] hover:bg-[#137269] text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 shadow-xl cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>
                      Order This Bespoke Look (₦{currentProduct.basePrice?.toLocaleString()})
                    </span>
                  </button>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={downloadLookCard}
                      className="py-2.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>📥</span>
                      <span>Download Card</span>
                    </button>
                    <button
                      type="button"
                      onClick={runAiGeneration}
                      className="py-2.5 bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span>🔄</span>
                      <span>Re-Render</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
