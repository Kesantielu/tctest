// Языковые переводы
const translations = {
    ru: {
        appTitle: "ПДД Тест",
        correctLabel: "Правильно:",
        totalLabel: "Всего:",
        accuracyLabel: "Точность:",
        questionPrefix: "Вопрос №",
        submitText: "Ответить",
        nextText: "Следующий вопрос",
        explanationTitle: "Объяснение:",
        detailedTitle: "Подробное объяснение инструктора",
        loadingText: "Загрузка вопросов...",
        errorText: "Ошибка загрузки данных",
        videoError: "Ваш браузер не поддерживает видео."
    },
    kz: {
        appTitle: "ЖҚЕ Тест",
        correctLabel: "Дұрыс:",
        totalLabel: "Барлығы:",
        accuracyLabel: "Дәлдік:",
        questionPrefix: "Сұрақ №",
        submitText: "Жауап беру",
        nextText: "Келесі сұрақ",
        explanationTitle: "Түсіндірме:",
        detailedTitle: "Нұсқаушының толық түсіндірмесі",
        loadingText: "Сұрақтар жүктелуде...",
        errorText: "Деректерді жүктеу қатесі",
        videoError: "Сіздің браузеріңіз бейнені қолдамайды."
    },
    en: {
        appTitle: "Traffic Rules Test",
        correctLabel: "Correct:",
        totalLabel: "Total:",
        accuracyLabel: "Accuracy:",
        questionPrefix: "Question #",
        submitText: "Submit Answer",
        nextText: "Next Question",
        explanationTitle: "Explanation:",
        detailedTitle: "Detailed instructor explanation",
        loadingText: "Loading questions...",
        errorText: "Data loading error",
        videoError: "Your browser does not support video."
    }
};

// Глобальные переменные
let questions = [];
let currentQuestion = null;
let selectedAnswer = null;
let answered = false;
let stats = {
    correct: 0,
    total: 0
};
let currentLang = 'ru';

// Инициализация приложения
async function init() {
    // Сброс состояния при повторной инициализации
    document.getElementById('loading').style.display = 'block';
    document.getElementById('error').style.display = 'none';
    document.getElementById('questionContainer').style.display = 'none';

    try {
        await loadQuestions();
        setupEventListeners();
        loadNextQuestion();
        updateStats();
    } catch (error) {
        console.error('Initialization error:', error);
        showError(error);
    }
}

// Загрузка вопросов из файла questions.json
async function loadQuestions() {
    try {
        console.log('Attempting to load questions.json...');
        const response = await fetch('./questions.json');

        console.log('Response:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log('Response length:', text.length);

        if (!text.trim()) {
            throw new Error('Файл questions.json пустой');
        }

        questions = JSON.parse(text);
        console.log('Successfully loaded questions:', questions.length);

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Файл questions.json не содержит вопросов или имеет неправильный формат');
        }

        // Проверяем структуру первого вопроса
        const firstQuestion = questions[0];
        if (!firstQuestion.question || !firstQuestion.answers || !Array.isArray(firstQuestion.answers)) {
            throw new Error('Неправильная структура данных в questions.json');
        }

        console.log('Sample question structure:', {
            id: firstQuestion.id,
            hasQuestion: !!firstQuestion.question,
            answersCount: firstQuestion.answers?.length,
            hasExplanation: !!firstQuestion.explanation
        });

        document.getElementById('loading').style.display = 'none';
        document.getElementById('questionContainer').style.display = 'block';

    } catch (error) {
        console.error('Error loading questions:', error);
        throw error;
    }
}

// Настройка обработчиков событий
function setupEventListeners() {
    // Переключение языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchLanguage(e.target.dataset.lang);
        });
    });
}

// Переключение языка
function switchLanguage(lang) {
    currentLang = lang;

    // Обновляем активную кнопку языка
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-lang="${lang}"]`).classList.add('active');

    // Обновляем переводы
    updateTranslations();

    // Перезагружаем текущий вопрос
    if (currentQuestion) {
        displayQuestion(currentQuestion);
    }
}

// Обновление переводов интерфейса
function updateTranslations() {
    const t = translations[currentLang];

    document.getElementById('appTitle').textContent = t.appTitle;
    document.getElementById('correctLabel').textContent = t.correctLabel;
    document.getElementById('totalLabel').textContent = t.totalLabel;
    document.getElementById('accuracyLabel').textContent = t.accuracyLabel;
    document.getElementById('submitText').textContent = t.submitText;
    document.getElementById('nextText').textContent = t.nextText;
    document.getElementById('explanationTitle').textContent = t.explanationTitle;
    document.getElementById('detailedTitle').textContent = t.detailedTitle;
    document.getElementById('loadingText').textContent = t.loadingText;
    document.getElementById('errorText').textContent = t.errorText;
    document.getElementById('videoError').textContent = t.videoError;
}

// Загрузка следующего вопроса
function loadNextQuestion() {
    if (questions.length === 0) {
        console.error('No questions available');
        return;
    }

    // Выбираем случайный вопрос
    const randomIndex = Math.floor(Math.random() * questions.length);
    currentQuestion = questions[randomIndex];

    console.log('Loading question:', currentQuestion.id);

    // Сбрасываем состояние
    selectedAnswer = null;
    answered = false;

    // Очищаем все стили выбора и подсветки
    document.querySelectorAll('.answer-option').forEach(option => {
        option.classList.remove('selected', 'correct', 'incorrect');
        option.style.pointerEvents = 'auto';
    });

    // Очищаем выбранные radio buttons
    document.querySelectorAll('input[name="answer"]').forEach(radio => {
        radio.checked = false;
    });

    // Отображаем вопрос
    displayQuestion(currentQuestion);

    // Сбрасываем кнопки
    document.getElementById('submitBtn').style.display = 'inline-block';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('explanationContainer').style.display = 'none';

    // Сворачиваем детальное объяснение
    document.getElementById('detailedExplanation').classList.remove('expanded');
}

// Отображение вопроса
function displayQuestion(question) {
    const t = translations[currentLang];

    // ID вопроса
    document.getElementById('questionId').textContent = `${t.questionPrefix}${question.id}`;

    // Текст вопроса
    document.getElementById('questionText').textContent = question.question[currentLang];

    // Видео вопроса
    if (question.question_file) {
        const videoUrl = question.question_file.id;
        document.getElementById('videoSource').src = videoUrl;
        const video = document.getElementById('questionVideo');
        video.load();

        // Добавляем обработчик ошибок для видео
        video.onerror = function() {
            console.error('Error loading video:', videoUrl);
        };
    }

    // Варианты ответов
    displayAnswers(question.answers);
}

// Отображение вариантов ответов
function displayAnswers(answers) {
    const container = document.getElementById('answersContainer');
    container.innerHTML = '';

    answers.forEach((answer, index) => {
        const option = document.createElement('div');
        option.className = 'answer-option';
        option.onclick = () => selectAnswer(answer.id, option);

        option.innerHTML = `
                    <input type="radio" name="answer" value="${answer.id}" id="answer_${answer.id}">
                    <label for="answer_${answer.id}" class="answer-text">${answer.title[currentLang]}</label>
                `;

        container.appendChild(option);
    });
}

// Выбор ответа
function selectAnswer(answerId, element) {
    if (answered) return;

    // Убираем выделение с других вариантов
    document.querySelectorAll('.answer-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Выделяем выбранный вариант
    element.classList.add('selected');
    selectedAnswer = answerId;

    // Отмечаем radio button
    document.getElementById(`answer_${answerId}`).checked = true;
}

// Подтверждение ответа
function submitAnswer() {
    // Проверяем выбранный ответ через radio buttons
    const checkedRadio = document.querySelector('input[name="answer"]:checked');
    if (!checkedRadio || answered) {
        console.log('No answer selected or already answered');
        return;
    }

    selectedAnswer = parseInt(checkedRadio.value);
    answered = true;
    stats.total++;

    console.log('Selected answer:', selectedAnswer);

    // Находим правильный ответ
    const correctAnswer = currentQuestion.answers.find(a => a.is_correct);
    const isCorrect = selectedAnswer === correctAnswer.id;

    console.log('Correct answer:', correctAnswer.id, 'Is correct:', isCorrect);

    if (isCorrect) {
        stats.correct++;
    }

    // Подсвечиваем ответы
    currentQuestion.answers.forEach(answer => {
        const input = document.querySelector(`.answer-option input[value="${answer.id}"]`);
        const element = input.closest(".answer-option");
        if (element) {
            if (answer.is_correct) {
                element.classList.add('correct');
            } else if (answer.id === selectedAnswer && !answer.is_correct) {
                element.classList.add('incorrect');
            }
        }
    });

    // Отключаем возможность выбора других ответов
    document.querySelectorAll('.answer-option').forEach(option => {
        option.style.pointerEvents = 'none';
    });

    // Показываем объяснение
    showExplanation();

    // Переключаем кнопки
    document.getElementById('submitBtn').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'inline-block';

    // Обновляем статистику
    updateStats();
}

// Показ объяснения
function showExplanation() {
    const container = document.getElementById('explanationContainer');
    const explanationText = document.getElementById('explanationText');

    explanationText.textContent = currentQuestion.explanation[currentLang];
    container.style.display = 'block';

    // Заменяем видео на explanation_file
    if (currentQuestion.explanation_file) {
        const videoUrl = currentQuestion.explanation_file.id;
        document.getElementById('videoSource').src = videoUrl;
        document.getElementById('questionVideo').load();
    }

    // Показываем детальное объяснение если есть
    const detailedExplanation = document.getElementById('detailedExplanation');
    let hasDetailedVideo = false;
    let videoFileId = null;

    // Определяем какое видео использовать для детального объяснения
    if (currentLang === 'kz' && currentQuestion.explanation2_kz_file) {
        videoFileId = currentQuestion.explanation2_kz_file.id;
        hasDetailedVideo = true;
    } else if (currentLang !== 'en' && currentQuestion.explanation2_file) {
        // Для русского и казахского показываем explanation2_file если нет kz версии
        videoFileId = currentQuestion.explanation2_file.id;
        hasDetailedVideo = true;
    }

    console.log('Detailed video check:', {
        lang: currentLang,
        hasDetailedVideo,
        videoFileId,
        explanation2_file: currentQuestion.explanation2_file,
        explanation2_kz_file: currentQuestion.explanation2_kz_file
    });

    if (hasDetailedVideo && videoFileId) {
        detailedExplanation.style.display = 'block';
        const detailedVideoUrl = videoFileId;
        document.getElementById('detailedVideoSource').src = detailedVideoUrl;

        // Перезагружаем видео
        const detailedVideo = document.querySelector('#detailedExplanation video');
        if (detailedVideo) {
            detailedVideo.load();
        }
    } else {
        detailedExplanation.style.display = 'none';
    }
}

// Переключение детального объяснения
function toggleDetailedExplanation() {
    const element = document.getElementById('detailedExplanation');
    element.classList.toggle('expanded');
}

// Следующий вопрос
function nextQuestion() {
    // Включаем обратно возможность выбора ответов
    document.querySelectorAll('.answer-option').forEach(option => {
        option.style.pointerEvents = 'auto';
    });

    loadNextQuestion();
}

// Обновление статистики
function updateStats() {
    document.getElementById('correctCount').textContent = stats.correct;
    document.getElementById('totalCount').textContent = stats.total;

    const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
    document.getElementById('accuracy').textContent = `${accuracy}%`;
}

// Показ ошибки
function showError(error) {
    document.getElementById('loading').style.display = 'none';
    document.getElementById('error').style.display = 'block';

    // Показываем детали ошибки
    const errorDetails = document.getElementById('errorDetails');
    if (error) {
        errorDetails.textContent = `Детали: ${error.message}`;
        errorDetails.style.display = 'block';
    }
}

// Запуск приложения
document.addEventListener('DOMContentLoaded', init);