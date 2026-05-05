// src/components/TreeGrowthStage.jsx
//
// 사용법:
//   import TreeGrowthStage from './components/TreeGrowthStage';
//   <TreeGrowthStage completedBooks={5} />
//
// props:
//   completedBooks  number  아이가 완청한 동화 편수 (0~10)

import React from 'react';
import './TreeGrowthStage.css';

const STAGES = [
  { emoji: '🌱', name: '씨앗',    badge: '1-2편',   min: 1,  max: 2  },
  { emoji: '🌿', name: '새싹',    badge: '3-4편',   min: 3,  max: 4  },
  { emoji: '🌳', name: '나무',    badge: '5-7편',   min: 5,  max: 7  },
  { emoji: '🍎', name: '열매나무', badge: '8-9편',  min: 8,  max: 9  },
  { emoji: '✨', name: '별빛나무', badge: '10편 완성!', min: 10, max: 10 },
];

function getCurrentStageIndex(completedBooks) {
  if (completedBooks <= 0) return -1;
  for (let i = STAGES.length - 1; i >= 0; i--) {
    if (completedBooks >= STAGES[i].min) return i;
  }
  return -1;
}

export default function TreeGrowthStage({ completedBooks = 0 }) {
  const currentIndex = getCurrentStageIndex(completedBooks);

  return (
    <div className="tgs-wrapper">
      <p className="tgs-header-text">나무 성장 5단계 — 동화 10편 완청 시 별빛나무 달성</p>

      <div className="tgs-roadmap">
        {STAGES.map((stage, index) => {
          const isCurrent = index === currentIndex;
          const isDone    = index < currentIndex;

          return (
            <React.Fragment key={stage.name}>
              <div className="tgs-stage">
                {/* 아이콘 원 */}
                <div
                  className={[
                    'tgs-icon-circle',
                    isCurrent ? 'tgs-icon-current' : '',
                    isDone    ? 'tgs-icon-done'    : '',
                  ].join(' ')}
                >
                  <span className={`tgs-emoji${isCurrent ? ' tgs-emoji-current' : ''}`}>
                    {stage.emoji}
                  </span>
                </div>

                {/* 이름 */}
                <p className={[
                  'tgs-name',
                  isCurrent ? 'tgs-name-current' : '',
                  isDone    ? 'tgs-name-done'    : '',
                ].join(' ')}>
                  {stage.name}
                </p>

                {/* 배지 */}
                <span className={[
                  'tgs-badge',
                  isCurrent ? 'tgs-badge-current' : '',
                  isDone    ? 'tgs-badge-done'    : '',
                ].join(' ')}>
                  {stage.badge}
                </span>
              </div>

              {/* 구분 대시 */}
              {index < STAGES.length - 1 && (
                <div className="tgs-connector">—</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
