// Alert.jsx
import React, { useState, useImperativeHandle, forwardRef } from "react";

const Alert = forwardRef((props, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState({ message: "", isCorrect: null, emoji: "", onClose: null });

    // 부모 컴포넌트에서 이 ref를 통해 알림창을 직접 조종합니다.
    useImperativeHandle(ref, () => ({
        show: (message, isCorrect, emoji = "", onCloseCallback) => {
            setConfig({ message, isCorrect, emoji, onClose: onCloseCallback });
            setIsOpen(true);
        }
    }));

    if (!isOpen) return null;

    const handleClose = () => {
        setIsOpen(false);
        if (config.onClose) config.onClose(); // 닫힐 때 실행할 동작이 있다면 실행
    };

    // --- 스타일 정의 ---
    const styles = {
        container: {
            position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
            background: "#ffffff", borderRadius: "32px", padding: "32px 24px", width: "90%", maxWidth: "380px",
            textAlign: "center", zIndex: 1000,
            border: config.isCorrect ? "4px solid #ffd8a8" : (config.isCorrect === false ? "4px solid #d0ebff" : "4px solid #eee1d0"),
            boxShadow: "0 15px 35px rgba(58, 42, 35, 0.25)",
            animation: "popUpOnly 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)"
        },
        button: {
            background: config.isCorrect ? "#ffd8a8" : (config.isCorrect === false ? "#e7f5ff" : "#eee1d0"),
            color: config.isCorrect ? "#d9480f" : (config.isCorrect === false ? "#1c7ed6" : "#3a2a23"),
            border: "none", borderRadius: "20px", padding: "14px 28px", fontSize: "18px", fontWeight: "800", cursor: "pointer", width: "100%"
        }
    };

    const renderEmoji = config.emoji || (config.isCorrect ? "🎉" : (config.isCorrect === false ? "🤔" : "🎙️"));

    return (
        <>
            <style>{`
                @keyframes popUpOnly { from { transform: translate(-50%, -50%) scale(0.8); opacity: 0; } to { transform: translate(-50%, -50%) scale(1); opacity: 1; } }
                @keyframes bounce { from { transform: translateY(0); } to { transform: translateY(-10px); } }
            `}</style>
            <div style={styles.container} onClick={handleClose}>
                <div style={{ fontSize: "64px", marginBottom: "16px", animation: "bounce 1s infinite alternate" }}>
                    {renderEmoji}
                </div>
                <p style={{ fontSize: "19px", fontWeight: "800", color: "#3a2a23", lineHeight: "1.6", marginBottom: "24px", wordBreak: "keep-all" }}>
                    {config.message}
                </p>
                <button style={styles.button}>
                    확인
                </button>
            </div>
        </>
    );
});

export default Alert;