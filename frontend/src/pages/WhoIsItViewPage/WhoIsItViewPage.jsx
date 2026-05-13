import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API_BASE_URL from "../../config/apiConfig";
import VoiceBadge from "../../components/VoiceBadge.jsx";
import LoadingOverlay from "../../components/LoadingOverlay.jsx";
import Alert from "../../components/Alert.jsx";
import "./WhoIsItViewPage.css";

function WhoIsItViewPage() {
    const alertRef = useRef();

    const navigate = useNavigate();
    const [quizData, setQuizData] = useState(null);
    const [options, setOptions] = useState([]);
    const [currentVoiceKey, setCurrentVoiceKey] = useState(null);
    const [isCorrect, setIsCorrect] = useState(null);
    const [currentAudioUrl, setCurrentAudioUrl] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [fixedMessages, setFixedMessages] = useState({ correct: "", incorrect: "" });
    const [resultAudioUrls, setResultAudioUrls] = useState({ correct: null, incorrect: null });

    // 현재 재생 중인 오디오를 담아둘 Ref
    const activeAudioRef = useRef(null);
    const isMounted = useRef(true);

    // 페이지를 아예 나갈 때(언마운트)를 위한 안전장치 추가
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }
        };
    }, []);

    const blobUrlsRef = useRef({ current: null, correct: null, incorrect: null });
    useEffect(() => {
        blobUrlsRef.current = {
            current: currentAudioUrl,
            correct: resultAudioUrls.correct,
            incorrect: resultAudioUrls.incorrect
        };
    }, [currentAudioUrl, resultAudioUrls]);

    useEffect(() => {
        return () => {
            const urls = blobUrlsRef.current;
            if (urls.current) URL.revokeObjectURL(urls.current);
            if (urls.correct) URL.revokeObjectURL(urls.correct);
            if (urls.incorrect) URL.revokeObjectURL(urls.incorrect);
        };
    }, []);

    const fetchQuizPair = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/quizzes/responses/pair`);
            if (res.ok) {
                const data = await res.json();
                setFixedMessages({
                    correct: data.correct.text,
                    incorrect: data.incorrect.text
                });
            }
        } catch (err) {
            console.error("메시지 쌍을 가져오지 못했습니다:", err);
        }
    };

    useEffect(() => {
        fetchQuizPair();
    }, []);

    // 퀴즈 데이터를 가져오고 보기를 섞는 함수
    const fetchRandomQuiz = async () => {
        try {
            // 새로운 문제를 불러올 때도 이전에 나오던 소리는 다정하게 꺼주기
            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
                activeAudioRef.current = null;
            }

            const res = await fetch(`${API_BASE_URL}/api/quizzes`);
            const data = await res.json();
            const allQuizzes = data.quizzes;

            // 1. 랜덤하게 문제 하나 선택
            const randomIndex = Math.floor(Math.random() * allQuizzes.length);
            const selectedQuiz = allQuizzes[randomIndex];

            // 2. 정답을 제외한 나머지 리스트에서 오답 3개 무작위 추출
            const wrongAnswers = allQuizzes
                .filter(q => q.id !== selectedQuiz.id)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3)
                .map(q => q.answer);

            // 3. 정답과 오답을 합쳐서 무작위로 섞기
            const combinedOptions = [selectedQuiz.answer, ...wrongAnswers].sort(() => 0.5 - Math.random());

            await fetchQuizPair();

            setQuizData(selectedQuiz);
            setOptions(combinedOptions);
            setIsCorrect(null); // 새로운 문제이므로 정답 상태 초기화

            // 새로운 문제로 넘어갈 때 이전 음성 URL 메모리 해제 및 초기화
            if (currentAudioUrl) {
                URL.revokeObjectURL(currentAudioUrl);
                setCurrentAudioUrl(null);
            }
            if (resultAudioUrls.correct) URL.revokeObjectURL(resultAudioUrls.correct);
            if (resultAudioUrls.incorrect) URL.revokeObjectURL(resultAudioUrls.incorrect);
            setResultAudioUrls({ correct: null, incorrect: null });

        } catch (err) {
            console.error("퀴즈 데이터 로딩 실패:", err);
        }
    };

    useEffect(() => {
        fetchRandomQuiz();
    }, []);

    useEffect(() => {
        if (quizData && currentVoiceKey) {
            playHint();
        }
    }, [quizData, currentVoiceKey]);

    // 부모님 목소리로 힌트 듣기 (TTS 재생 로직)
    const playHint = async () => {
        if (!quizData || !currentVoiceKey) {
            alertRef.current.show("목소리를 먼저 선택해주세요!", false, "🎙️");
            return;
        }

        // 이미 재생 중인 소리가 있다면 겹쳐 들리지 않게
        if (activeAudioRef.current) {
            activeAudioRef.current.pause();
        }

        // 이미 생성된 음성 URL이 있다면 서버 호출 없이 바로 재생
        if (currentAudioUrl) {
            const audio = new Audio(currentAudioUrl);
            activeAudioRef.current = audio;
            audio.play();
            return;
        }

        setIsLoading(true);
        console.log(`부모님 목소리(${currentVoiceKey})로 재생: ${quizData.voiceScript}`);

        try {
            const voiceId = localStorage.getItem(currentVoiceKey);
            const response = await fetch(`${API_BASE_URL}/api/quizzes/play?quiz_id=${quizData.id}&voice_id=${voiceId}`, {
                method: "GET",
            });

            if (!isMounted.current) return;

            if (response.ok) {
                const audioBlob = await response.blob();
                const audioUrl = URL.createObjectURL(audioBlob);
                setCurrentAudioUrl(audioUrl); // 생성된 URL 상태에 저장
                const audio = new Audio(audioUrl);
                activeAudioRef.current = audio; // 6. 보물 상자에 넣어두기
                audio.play(); // 아이에게 다정한 힌트 들려주기!

                if (!isMounted.current) return;

                if (!resultAudioUrls.correct && fixedMessages.correct) {
                    const correctText = formatMessage(fixedMessages.correct);
                    fetch(`${API_BASE_URL}/api/quizzes/play_text?text=${encodeURIComponent(correctText)}&voice_id=${voiceId}&emotion=happy`)
                        .then(res => res.blob())
                        .then(blob => {
                            setResultAudioUrls(prev => ({ ...prev, correct: URL.createObjectURL(blob) }));
                        })
                        .catch(err => console.error("정답 음성 미리 로드 실패:", err));
                }

                if (!resultAudioUrls.incorrect && fixedMessages.incorrect) {
                    const incorrectText = formatMessage(fixedMessages.incorrect);
                    fetch(`${API_BASE_URL}/api/quizzes/play_text?text=${encodeURIComponent(incorrectText)}&voice_id=${voiceId}&emotion=calm`)
                        .then(res => res.blob())
                        .then(blob => {
                            setResultAudioUrls(prev => ({ ...prev, incorrect: URL.createObjectURL(blob) }));
                        })
                        .catch(err => console.error("오답 음성 미리 로드 실패:", err));
                }
            } else {
                console.error("앗, 오디오 파일을 가져오는 데 문제가 생겼어요.");
            }
        } catch (err) {
            console.error("음성 재생 실패:", err);
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
            }
        }
    };

    const formatMessage = (template) => {
        const storedName = localStorage.getItem("mpt_child_name");
        const name = storedName && storedName.trim() !== "" ? storedName : "아가";

        const lastChar = name.charCodeAt(name.length - 1);
        const isHangul = lastChar >= 0xac00 && lastChar <= 0xd7a3;
        const hasBatchim = isHangul ? (lastChar - 0xac00) % 28 > 0 : false;

        return template
            .replace(/\[이름\/이\]/g, name + (hasBatchim ? "이" : ""))
            .replace(/\[이름(은|이는)\/는\]/g, name + (hasBatchim ? "이는" : "는"))
            .replace(/\[이름이\/가\]/g, name + (hasBatchim ? "이" : "가"))
            .replace(/\[이름아\/야\]/g, name + (hasBatchim ? "아" : "야"));
    };

    const handleAnswerClick = (selected) => {
        if (selected === quizData.answer) {
            setIsCorrect(true);

            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
            }

            if (resultAudioUrls.correct) {
                const audio = new Audio(resultAudioUrls.correct);
                activeAudioRef.current = audio;
                audio.play();
            }

            const successMsg = formatMessage(fixedMessages.correct || "정답이야! 우리 [이름/이] 정말 대단해!");
            alertRef.current.show(successMsg, true, "🎉", () => {
                fetchRandomQuiz();
            });
        } else {
            setIsCorrect(false);

            if (activeAudioRef.current) {
                activeAudioRef.current.pause();
            }
            if (resultAudioUrls.incorrect) {
                const audio = new Audio(resultAudioUrls.incorrect);
                activeAudioRef.current = audio;
                audio.play();
            }

            const failMsg = formatMessage(fixedMessages.incorrect || "아쉽다! [이름아/야], 다시 한번 생각해보자~");
            alertRef.current.show(failMsg, false, "🤔");
        }
    };

    return (
        <div className="tablet-page">
            <VoiceBadge onKeyDetected={(key) => setCurrentVoiceKey(key)} />

            <main className="tablet-frame quiz-frame">
                <header className="header-section">
                    <p className="service-label">MAMA / PAPA TELLER</p>
                    <h1 className="main-title">누구일까? 퀴즈</h1>
                </header>

                {quizData && (
                    <section className="quiz-content">
                        <div className="quiz-image-container">
                            {/* 로딩 중일 때 보여줄 오버레이 */}
                            {isLoading && (
                                <LoadingOverlay
                                    message={<>엄마 아빠 목소리를 불러오고 있어...<br />잠시만 기다려줘! ✨</>}
                                />
                            )}
                            <img src={quizData.imageUrl} alt="퀴즈 이미지" className="quiz-main-image" />
                            <button className="play-hint-btn" onClick={playHint}>
                                🔊 부모님 힌트 다시 듣기
                            </button>
                        </div>

                        <div className="options-grid">
                            {options.map((option, index) => (
                                <button
                                    key={index}
                                    className="option-button"
                                    onClick={() => handleAnswerClick(option)}
                                >
                                    {option}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                <div className="quiz-footer">
                    <button className="pag-btn" onClick={() => navigate(-1)}>뒤로가기</button>
                    <button className="pag-btn" onClick={fetchRandomQuiz}>다른 문제 풀기</button>
                </div>
            </main>
            <Alert ref={alertRef} />
        </div>
    );
}

export default WhoIsItViewPage;