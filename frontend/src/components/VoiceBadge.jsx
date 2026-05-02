import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function VoiceBadge({ onKeyDetected }) {
    const navigate = useNavigate();
    const [displayVoiceId, setDisplayVoiceId] = useState(null);

    useEffect(() => {
        // 배지 정보를 갱신하는 함수를 별도로 분리합니다.
        const updateBadge = () => {
            const activeVoiceKey = localStorage.getItem("mpt_selected_voice_key");
            if (activeVoiceKey) {
                const selectedId = localStorage.getItem(activeVoiceKey);
                if (selectedId) {
                    // setDisplayVoiceId(selectedId);
                    const cleanName = activeVoiceKey
                        .replace("mpt_", "")
                        .replace("_voice_id", "");
                    setDisplayVoiceId(cleanName);
                    if (onKeyDetected) onKeyDetected(activeVoiceKey);
                }
            } else {
                setDisplayVoiceId(null);
                if (onKeyDetected) onKeyDetected(null);
            }
        };

        // 처음 로드될 때 실행
        updateBadge();

        // 커스텀 이벤트 "voiceChanged"가 발생하면 updateBadge를 실행
        window.addEventListener("voiceChanged", updateBadge);
        // 다른 탭에서 변경될 경우를 대비한 storage 이벤트도 유지
        window.addEventListener("storage", updateBadge);

        return () => {
            // 청소할 때 귀(리스너)도 같이 떼어줍니다.
            window.removeEventListener("voiceChanged", updateBadge);
            window.removeEventListener("storage", updateBadge);
        };
    }, [onKeyDetected]);

    // 전체 상단 바 스타일 (화면 양 끝으로 요소를 배치합니다)
    const topBarStyle = {
        position: "absolute",
        top: "4px",
        left: "20px",
        right: "20px",
        zIndex: 100,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
    };

    const badgeStyle = {
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 12px",
        backgroundColor: "rgba(232, 245, 233, 0.8)",
        borderRadius: "30px",
        border: "1px solid #c8e6c9",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        visibility: displayVoiceId ? "visible" : "hidden",
    };

    const homeButtonStyle = {
        width: "40px",
        height: "40px",
        borderRadius: "50%",
        backgroundColor: "rgba(255, 255, 255, 0.9)",
        border: "1px solid #f0e2d3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        fontSize: "20px",
        boxShadow: "0 4px 10px rgba(162, 109, 61, 0.15)",
        transition: "transform 0.2s ease",
    };

    const textStyle = {
        fontSize: "0.75rem",
        color: "#2e7d32",
        fontWeight: "600",
        maxWidth: "120px",
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
    };

    const dotStyle = {
        fontSize: "0.6rem",
        color: "#4caf50",
    };

    return (
        <div style={topBarStyle}>
            <style>
                {`
                @keyframes blink {
                    0% { opacity: 1; }
                    50% { opacity: 0.4; }
                    100% { opacity: 1; }
                }
                .dot-blink {
                    animation: blink 2s infinite;
                }
                .home-btn:active {
                    transform: scale(0.9);
                }
                `}
            </style>

            {/* 왼쪽: 보이스 뱃지 */}
            <div style={badgeStyle}>
                <span className="dot-blink" style={dotStyle}>●</span>
                <span style={textStyle}>{displayVoiceId || "선택된 목소리 없음"}</span>
            </div>

            {/* 오른쪽: 홈 버튼 */}
            <div
                className="home-btn"
                style={homeButtonStyle}
                onClick={() => navigate("/")} // MODIFIED: 홈 경로로 이동
                title="홈으로 가기"
            >
                🏠
            </div>
        </div>
    );
}

export default VoiceBadge;