import React from "react";

function LoadingOverlay({ message }) {
    // 기본 다정한 메시지 설정
    const defaultMessage = (
        <>
            엄마 아빠 목소리를 불러오고 있어...
            <br /> 잠시만 기다려줘! ✨
        </>
    );

    return (
        <div className="loading-overlay">
            {/* 컴포넌트 내부에서만 사용할 키프레임 스타일 주입 */}
            <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>

            <div style={styles.overlay}>
                <div style={styles.spinner}></div>
                <p style={styles.text}>{message || defaultMessage}</p>
            </div>
        </div>
    );
}

// 마마파파 텔러의 따뜻한 감성을 담은 스타일 정의
const styles = {
    overlay: {
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 10,
        borderRadius: "20px",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        animation: "fadeIn 0.3s ease-in-out",
    },
    spinner: {
        width: "50px",
        height: "50px",
        border: "6px solid #f3f3f3",
        borderTop: "6px solid #ffafbd",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
    },
    text: {
        marginTop: "20px",
        fontSize: "1.2rem",
        color: "#555",
        fontWeight: "600",
        textAlign: "center",
        lineHeight: "1.5",
        wordBreak: "keep-all",
    },
};

export default LoadingOverlay;