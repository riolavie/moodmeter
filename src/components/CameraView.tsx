import React, { useRef, useState, useEffect } from 'react';
import { PRESET_EXPRESSIONS } from '../data/rulerData';
import { soundFx } from '../utils/audio';

interface CameraViewProps {
  onCapture: (imageDataUrl: string | null, presetId?: string) => void;
  mirrorCamera: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, mirrorCamera }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [customPhotoUrl, setCustomPhotoUrl] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);

  // Initialize camera stream
  const startCamera = async (mode = facingMode) => {
    try {
      setCameraError(null);
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }

      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const constraints: MediaStreamConstraints = {
          video: {
            facingMode: mode,
            width: { ideal: 640 },
            height: { ideal: 640 }
          },
          audio: false
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamActive(true);
          setCustomPhotoUrl(null);
          setSelectedPresetId(null);
        }
      } else {
        setCameraError('이 브라우저에서는 카메라 접근이 지원되지 않습니다.');
      }
    } catch (err: unknown) {
      console.warn('Camera stream could not start:', err);
      setStreamActive(false);
      setCameraError('카메라 권한을 허용해주시거나 사진을 업로드해 보세요.');
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  // Capture snapshot from video or selected photo
  const handleCaptureClick = () => {
    soundFx.playShutter();

    if (customPhotoUrl) {
      onCapture(customPhotoUrl, selectedPresetId || undefined);
      return;
    }

    if (streamActive && videoRef.current) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 480;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          if (mirrorCamera && facingMode === 'user') {
            ctx.translate(canvas.width, 0);
            ctx.scale(-1, 1);
          }
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          onCapture(dataUrl);
          return;
        }
      } catch (e) {
        console.error('Snapshot capture failed:', e);
      }
    }

    // Default simulation capture if no live camera or custom image
    onCapture(null, selectedPresetId || 'happy');
  };

  // Toggle front/back camera
  const handleToggleFacingMode = () => {
    soundFx.playTap();
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
  };

  // Handle uploaded local image
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        setCustomPhotoUrl(url);
        setSelectedPresetId(null);
        if (streamActive && videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          setStreamActive(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle selecting preset expression
  const handleSelectPreset = (presetId: string) => {
    soundFx.playTap();
    setSelectedPresetId(presetId);
    setCustomPhotoUrl(null);
  };

  return (
    <section id="viewCamera" className="flex-1 flex flex-col justify-between py-1">
      {/* High Density Status Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${streamActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="font-semibold text-slate-700 tracking-tight">
            {streamActive ? 'CAMERA STREAM ACTIVE' : 'OPTICAL READY'}
          </span>
        </div>
        <div className="text-[11px] text-slate-500 font-mono">
          {streamActive ? (facingMode === 'user' ? 'FRONT_CAM' : 'ENV_CAM') : 'STANDBY'}
        </div>
      </div>

      {/* Camera Guidance */}
      <div className="text-center my-2">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          얼굴 표정을 인식합니다
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          원형 가이드 안에 얼굴을 맞추고 찰칵 버튼을 눌러주세요
        </p>
      </div>

      {/* High Density Circular Camera Preview Container */}
      <div className="relative my-auto flex flex-col items-center">
        <div
          className="relative w-60 h-60 rounded-full bg-slate-900 shadow-sm flex items-center justify-center overflow-hidden border-2 border-slate-200 transition-all duration-300 ring-4 ring-slate-100"
        >
          {/* Live Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover rounded-full ${
              streamActive && !customPhotoUrl ? 'block' : 'hidden'
            } ${mirrorCamera && facingMode === 'user' ? '-scale-x-100' : ''}`}
          />

          {/* Uploaded custom photo preview */}
          {customPhotoUrl && (
            <img
              src={customPhotoUrl}
              alt="Uploaded face preview"
              className="w-full h-full object-cover rounded-full"
            />
          )}

          {/* Placeholder / Preset Display */}
          {!streamActive && !customPhotoUrl && (
            <div className="flex flex-col items-center justify-center text-center p-4">
              {selectedPresetId ? (
                <div className="flex flex-col items-center">
                  <span className="text-5xl mb-1.5">
                    {PRESET_EXPRESSIONS.find((p) => p.id === selectedPresetId)?.avatarEmoji || '😊'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-900 bg-white/95 px-2.5 py-0.5 rounded border border-slate-200 shadow-xs">
                    {PRESET_EXPRESSIONS.find((p) => p.id === selectedPresetId)?.label}
                  </span>
                </div>
              ) : (
                <>
                  <span className="material-symbols-outlined text-5xl text-slate-500 mb-1">
                    photo_camera
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    카메라 준비 중
                  </span>
                </>
              )}
            </div>
          )}

          {/* High Density Reticle & Guide */}
          <div className="absolute inset-0 border border-dashed border-indigo-400/60 rounded-full m-3 pointer-events-none" />

          {/* High Density Technical Crosshairs */}
          <div className="absolute w-4 h-0.5 bg-indigo-400/70 pointer-events-none" />
          <div className="absolute h-4 w-0.5 bg-indigo-400/70 pointer-events-none" />

          {/* Telemetry Corner Indicators */}
          <div className="absolute top-3 left-3 text-[9px] font-mono text-indigo-300 font-bold pointer-events-none">
            [+]
          </div>
          <div className="absolute bottom-3 right-3 text-[9px] font-mono text-indigo-300 font-bold pointer-events-none">
            [+]
          </div>
        </div>

        {/* Quick Camera Action Controls */}
        <div className="flex items-center gap-2 mt-3">
          <button
            type="button"
            onClick={() => startCamera(facingMode)}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            title="카메라 켜기/새로고침"
          >
            <span className="material-symbols-outlined text-[16px] text-indigo-600">videocam</span>
            {streamActive ? '재시작' : '카메라 켜기'}
          </button>

          {streamActive && (
            <button
              type="button"
              onClick={handleToggleFacingMode}
              className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-lg transition-colors shadow-xs"
              title="카메라 전환"
            >
              <span className="material-symbols-outlined text-[16px]">flip_camera_ios</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors shadow-xs"
            title="사진 파일 가져오기"
          >
            <span className="material-symbols-outlined text-[16px]">upload_file</span>
            사진 올리기
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />
        </div>

        {cameraError && (
          <p className="text-[11px] text-amber-800 mt-2 text-center max-w-xs px-2.5 bg-amber-50 rounded-lg py-1 border border-amber-200">
            {cameraError}
          </p>
        )}
      </div>

      {/* Preset Expression Fast Selector */}
      <div className="w-full mt-2 mb-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <div className="flex items-center justify-between mb-1.5 px-0.5">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px] text-indigo-600">sentiment_satisfied</span>
            빠른 표정 프리셋
          </span>
          <span className="text-[10px] text-slate-500 font-medium">원클릭 테스트</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_EXPRESSIONS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset.id)}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left border text-xs transition-all ${
                  isSelected
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 font-semibold shadow-xs'
                    : 'bg-white hover:bg-slate-100/80 border-slate-200 text-slate-700'
                }`}
              >
                <span className="text-base">{preset.avatarEmoji}</span>
                <div className="overflow-hidden">
                  <div className="font-semibold text-xs truncate leading-tight">{preset.label}</div>
                  <div className="text-[10px] text-slate-500 truncate">{preset.subtitle}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Primary Capture Action Button */}
      <button
        id="btnCapture"
        type="button"
        onClick={handleCaptureClick}
        className="w-full bg-slate-900 hover:bg-slate-800 active:scale-[0.99] text-white font-semibold text-sm py-3 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer mt-1"
      >
        <span className="material-symbols-outlined text-[18px]">photo_camera</span>
        표정 캡처 & 4분면 분석하기
      </button>
    </section>
  );
};
