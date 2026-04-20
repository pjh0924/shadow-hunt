/**
 * CameraPreview.tsx
 * --------------------------------------------------------------
 * `<video>` + getUserMedia 로 라이브 카메라 프리뷰.
 * 후면 카메라(environment) 우선, 실패 시 기본(전면).
 *
 * 반환되는 stream 을 외부로도 노출 → Step 3 에서 ML 이
 *  <video> 요소를 입력으로 쓸 수 있게.
 */
import { forwardRef, useEffect, useRef, useState, useImperativeHandle } from 'react';

export interface CameraPreviewHandle {
  video: HTMLVideoElement | null;
  restart: () => Promise<void>;
  takeFrame: () => string | null; // dataURL
}

interface Props {
  onError?: (err: Error) => void;
  onReady?: (video: HTMLVideoElement) => void;
}

const CameraPreview = forwardRef<CameraPreviewHandle, Props>(
  ({ onError, onReady }, ref) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [active, setActive] = useState(false);

    const stop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setActive(false);
    };

    const startStream = async () => {
      stop();
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setActive(true);
          onReady?.(videoRef.current);
        }
      } catch (e) {
        onError?.(e as Error);
      }
    };

    useEffect(() => {
      startStream();
      return () => stop();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useImperativeHandle(
      ref,
      (): CameraPreviewHandle => ({
        video: videoRef.current,
        restart: startStream,
        takeFrame: () => {
          const v = videoRef.current;
          if (!v || v.videoWidth === 0) return null;
          const canvas = document.createElement('canvas');
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          canvas.getContext('2d')?.drawImage(v, 0, 0);
          return canvas.toDataURL('image/jpeg', 0.92);
        },
      }),
      []
    );

    return (
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        style={{ visibility: active ? 'visible' : 'hidden' }}
      />
    );
  }
);

CameraPreview.displayName = 'CameraPreview';
export default CameraPreview;
