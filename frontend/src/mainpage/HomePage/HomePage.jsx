import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import VoiceBadge from "../../components/VoiceBadge.jsx";
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    // 배지로부터 전달받은 현재 선택된 목소리 키를 관리합니다.
    const [currentVoiceKey, setCurrentVoiceKey] = useState(null);

    // 순수하게 이동 경로만 관리하는 메뉴 데이터
    const menus = [
        {
            id: 'family-voices',
            title: '우리 가족 목소리함',
            description: '사랑하는 우리 가족 중 누구의 목소리로 들어볼까요?',
            icon: '🎙️',
            path: '/pages/FamilyVoicesViewPage'
        },
        {
            id: 'story-list',
            title: '동화 나라 가기',
            description: '아이와 함께 읽을 이야기를 골라요',
            icon: '📚',
            path: '/pages/StoryListViewPage'
        },
        {
            id: 'who-is-it',
            title: '누구일까? 퀴즈',
            description: '부모님 목소리 힌트를 듣고 주인공을 찾아보세요!',
            icon: '🧩',
            path: '/pages/WhoIsItViewPage'
        }
    ];

    return (
        <div className="tablet-page">
            <VoiceBadge onKeyDetected={(key) => setCurrentVoiceKey(key)} />
            <div className="home-container">
                <header className="header-section">
                    <h1 className="main-title">
                        MAMA / PAPA TELLER
                    </h1>
                </header>

                <main className="menu-grid">
                    {menus.map((menu) => (
                        <div
                            key={menu.id}
                            className="menu-card"
                            onClick={() => {
                                if (!currentVoiceKey && menu.id !== 'family-voices') {
                                    alert("어떤 목소리로 이야기를 들려줄지 먼저 골라주세요! 🎙️");
                                } else {
                                    navigate(menu.path);
                                }
                            }}
                        >
                            <div className="menu-icon-wrapper">
                                <span className="menu-icon">{menu.icon}</span>
                            </div>
                            <div className="menu-info">
                                <h3>{menu.title}</h3>
                                <p>{menu.description}</p>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        </div>
    );
};

export default HomePage;