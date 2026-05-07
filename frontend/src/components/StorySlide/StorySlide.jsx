import React, { useState, useEffect, useRef } from "react";
import "./StorySlide.css";

function StorySlide({ page }) {
  const videoRef = useRef(null);

  const [isError, setIsError] = useState(false);
  const [displaySrc, setDisplaySrc] = useState("");
  const [isVideoReady, setIsVideoReady] = useState(false);

  // 1. 파일 주소 해결 함수
  const resolveMediaSrc = (src) => {
    if (!src) return "";
    if (/^(https?:|data:|blob:)/.test(src)) return src;
    if (src.startsWith("/")) return src;
    return `/${src}`;
  };

  // 2. MP4 비디오 판별 함수
  const isVideoFile = (src) => {
    if (!src) return false;
    return src.toLowerCase().endsWith(".mp4") || src.toLowerCase().includes(".mp4");
  };

  const newSrc = resolveMediaSrc(page?.image);

  // 3. 새 미디어 로드 완료 후 교체
  useEffect(() => {
    setIsError(false);
    setIsVideoReady(false);

    if (!newSrc) {
      setDisplaySrc("");
      return;
    }

    if (isVideoFile(newSrc)) {
      setDisplaySrc(newSrc);
    } else {
      const img = new Image();
      img.src = newSrc;

      img.onload = () => {
        setDisplaySrc(newSrc);
      };

      img.onerror = () => {
        setDisplaySrc(newSrc);
        setIsError(true);
      };
    }
  }, [newSrc]);

  const isVideo = isVideoFile(displaySrc);

  if (!page) {
    return <div className="illustration-card">데이터를 기다리는 중...</div>;
  }

  return (
    <>
      <div
        className="illustration-card"
        style={{ position: "relative", overflow: "hidden" }}
      >
        {displaySrc ? (
          isVideo ? (
            <>
              <video
                ref={videoRef}
                key={displaySrc}
                className="illustration-image"
                src={displaySrc}
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                controls={false}
                disablePictureInPicture
                controlsList="nodownload nofullscreen noplaybackrate"
                onLoadedData={() => {
                  videoRef.current
                    ?.play()
                    .then(() => setIsVideoReady(true))
                    .catch(() => setIsVideoReady(true));
                }}
                onPlaying={() => setIsVideoReady(true)}
                onError={() => setIsError(true)}
                style={{
                  objectFit: "cover",
                  width: "100%",
                  height: "100%",
                  display: "block",
                  opacity: isVideoReady ? 1 : 0,
                }}
              />
            </>
          ) : (
            <img
              className="illustration-image"
              src={displaySrc}
              alt="동화 이미지"
              onError={() => setIsError(true)}
            />
          )
        ) : (
          <div className="image-empty-box">이미지나 영상이 없습니다.</div>
        )}

        {isError && (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "#fff0f0",
              color: "#d32f2f",
              padding: "20px",
              fontSize: "14px",
              wordBreak: "break-all",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              border: "2px solid red",
              zIndex: 10,
            }}
          >
            <p style={{ fontWeight: "bold", marginBottom: "10px" }}>
              미디어(이미지/영상) 로드 실패
            </p>
            <p>
              <strong>넘어온 주소:</strong>{" "}
              {page.image || "값이 없음(null/undefined)"}
            </p>
            <p>
              <strong>실제 적용 주소:</strong>{" "}
              {displaySrc || "값이 없음(null/undefined)"}
            </p>
            <p style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
              frontend/public 안에 넣었다면 주소는
              /illusts/ST_002/scene_1.mp4 혹은 .png 형태여야 합니다.
            </p>
          </div>
        )}
      </div>

      <div className="story-text-card">
        <p>{page.text}</p>
      </div>
    </>
  );
}

export default StorySlide;
