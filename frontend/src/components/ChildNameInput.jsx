import React, { useState, useEffect } from "react";

/**
 * 어느 페이지에서나 아이의 이름을 관리하는 컴포넌트 
 */
function ChildNameInput({ onNameChange }) {
    const [childName, setChildName] = useState("");

    // 컴포넌트가 나타날 때, 기존에 저장된 우리 아이 이름을 불러옵니다.
    useEffect(() => {
        const savedName = localStorage.getItem("mpt_child_name") || "";
        setChildName(savedName);
        if (onNameChange) onNameChange(savedName);
    }, []);

    const handleChange = (e) => {
        const newName = e.target.value;
        setChildName(newName);

        // 브라우저에 보관하여 다른 페이지에서도 꺼내 쓸 수 있게 합니다.
        localStorage.setItem("mpt_child_name", newName);

        // 필요한 경우 부모 컴포넌트에게도 알려줍니다.
        if (onNameChange) onNameChange(newName);
    };

    return (
        <>
            <style>
                {`
                .child-name-section {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    padding-left: 16px;
                    /* 아이들의 정서를 고려한 부드러운 정렬 */
                }

                .child-name-label {
                    font-size: 14px;
                    font-weight: 600;
                    color: #5d4037; /* 따뜻한 나무색 계열 */
                    white-space: nowrap;
                }

                .child-name-input {
                    border: 2px solid #ffcc80; /* 부드러운 오렌지빛 테두리 */
                    border-radius: 20px;
                    padding: 6px 14px;
                    font-size: 14px;
                    outline: none;
                    width: 110px;
                    transition: all 0.3s ease;
                    background-color: #fffaf0; /* 포근한 미색 배경 */
                }

                .child-name-input:focus {
                    border-color: #ff8c00;
                    box-shadow: 0 0 5px rgba(255, 140, 0, 0.2);
                    background-color: #ffffff;
                }

                .child-name-input::placeholder {
                    color: #d7ccc8;
                    font-style: italic;
                }
                `}
            </style>

            <div className="child-name-section">
                <span className="child-name-label">우리 아이 이름</span>
                <input
                    className="child-name-input"
                    type="text"
                    placeholder="예: 민준, 윤서"
                    value={childName}
                    onChange={handleChange}
                    maxLength={6}
                />
            </div>
        </>
    );
}

export default ChildNameInput;