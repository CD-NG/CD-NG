const firebaseConfig = {
  apiKey: "AIzaSyDJx02fYp5DegmNI6gS530s0PIJ1UJn3-A",
  authDomain: "learning-planet-pb2204.firebaseapp.com",
  projectId: "learning-planet-pb2204",
  storageBucket: "learning-planet-pb2204.firebasestorage.app",
  messagingSenderId: "994985831661",
  appId: "1:994985831661:web:af14fbf6cf27bf0ad8f0e4",
  databaseURL: "https://learning-planet-pb2204-default-rtdb.asia-southeast1.firebasedatabase.app/"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const database = firebase.database();


// App state
const state = {
    currentSubject: null,
    currentQuestion: 0,
    answers: [],
    startTime: null,
    timerInterval: null,
    questionCount: 10,
    quizType: 'random',
    leaderboard: JSON.parse(localStorage.getItem('leaderboard')) || [],
    questions: []
};

// DOM Elements
const homeSection = document.getElementById('home-section');
const scienceQuiz = document.getElementById('science-quiz');
const mathQuiz = document.getElementById('math-quiz');
const resultsSection = document.getElementById('results');
const leaderboardSection = document.getElementById('leaderboard');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const startQuizBtn = document.getElementById('start-quiz');
const questionCountSelect = document.getElementById('question-count');
const quizTypeSelect = document.getElementById('quiz-type');
const playerNameInput = document.getElementById('player-name');
const saveScoreBtn = document.getElementById('save-score');
const leaderboardBody = document.getElementById('leaderboard-body');

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderLeaderboard();
    loadRandomFacts();
});

function setupEventListeners() {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            showSection(section);
            document.querySelector('.navbar .nav-links').classList.remove('active');
        });
    });

    document.querySelectorAll('.subject-card').forEach(card => {
        card.addEventListener('click', () => {
            const subject = card.getAttribute('data-subject');
            showSettingsModal(subject);
        });
    });

    document.querySelector('.start-science').addEventListener('click', () => showSettingsModal('science'));
    document.querySelector('.start-math').addEventListener('click', () => showSettingsModal('math'));

    closeModal.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    startQuizBtn.addEventListener('click', () => {
        state.questionCount = parseInt(questionCountSelect.value);
        state.quizType = quizTypeSelect.value;
        settingsModal.style.display = 'none';
        loadQuestions(state.currentSubject);
    });

    document.getElementById('retry').addEventListener('click', () => startQuiz(state.currentSubject));
    document.getElementById('back-home').addEventListener('click', () => showSection('home'));
    document.getElementById('back-home-leaderboard').addEventListener('click', () => showSection('home'));

    saveScoreBtn.addEventListener('click', saveScore);
}

function loadRandomFacts() {
    const facts = [
        { title: "Math is Everywhere!", content: "Bees build honeycombs in hexagons, which use the least amount of wax." },
        { title: "Water Wonder", content: "Water exists as solid, liquid, and gas – the water cycle!" },
        { title: "Butterfly Magic", content: "Butterflies taste with their feet!" },
        { title: "Number Fun", content: "Zero was invented in India around the 5th century!" },
        { title: "Rainbow Science", content: "Rainbows form when sunlight bends through raindrops." },
        { title: "Shapes in Nature", content: "Spherical fruits hold the most volume with the least surface." }
    ];

    const factsContainer = document.getElementById('facts-container');
    factsContainer.innerHTML = '';
    const selectedFacts = [...facts].sort(() => 0.5 - Math.random()).slice(0, 3);

    selectedFacts.forEach(fact => {
        const factCard = document.createElement('div');
        factCard.className = 'fact-card';
        factCard.innerHTML = `<h3>${fact.title}</h3><p>${fact.content}</p>`;
        factsContainer.appendChild(factCard);
    });
}

async function loadQuestions(subject) {
    try {
        const response = await fetch(`data/${subject}.json`);
        const allQuestions = await response.json();
        state.questions = getRandomQuestions(allQuestions, state.questionCount);
        startQuiz(subject);
    } catch (err) {
        alert("Failed to load questions. Please check your files.");
    }
}

function getRandomQuestions(pool, count) {
    const shuffled = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    // For each question, shuffle the options and update the correct answer index
    return shuffled.map((q) => {
        const originalAnswer = q.options[q.answer]; // Store the correct answer text
        const shuffledOptions = [...q.options].sort(() => 0.5 - Math.random());
        const newAnswerIndex = shuffledOptions.indexOf(originalAnswer); // Find the new index

        return {
            ...q,
            options: shuffledOptions,
            answer: newAnswerIndex // Update the answer index
        };
    });
}

function showSettingsModal(subject) {
    state.currentSubject = subject;
    settingsModal.style.display = 'flex';
}

function showSection(section) {
    homeSection.style.display = 'none';
    scienceQuiz.style.display = 'none';
    mathQuiz.style.display = 'none';
    resultsSection.style.display = 'none';
    leaderboardSection.style.display = 'none';

    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-section') === section) {
            link.classList.add('active');
        }
    });

    if (section === 'home') {
        homeSection.style.display = 'block';
        loadRandomFacts();
    } else if (section === 'science') {
        showSettingsModal('science');
    } else if (section === 'math') {
        showSettingsModal('math');
    } else if (section === 'leaderboard') {
        leaderboardSection.style.display = 'block';
        renderLeaderboard();
    }
}

function startQuiz(subject) {
    state.currentSubject = subject;
    state.currentQuestion = 0;
    state.answers = [];
    if (state.timerInterval) clearInterval(state.timerInterval);

    if (subject === 'science') {
        scienceQuiz.style.display = 'block';
        mathQuiz.style.display = 'none';
        document.getElementById('science-total').textContent = state.questionCount;
    } else {
        scienceQuiz.style.display = 'none';
        mathQuiz.style.display = 'block';
        document.getElementById('math-total').textContent = state.questionCount;
    }

    state.startTime = new Date();
    state.timerInterval = setInterval(updateTimer, 1000);
    displayQuestion();
    createPagination();
}

function updateTimer() {
    const now = new Date();
    const elapsed = Math.floor((now - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    if (state.currentSubject === 'science') {
        document.getElementById('science-timer').textContent = `${minutes}:${seconds}`;
    } else {
        document.getElementById('math-timer').textContent = `${minutes}:${seconds}`;
    }
}

function createPagination() {
    const paginationContainer = state.currentSubject === 'science' 
        ? document.getElementById('science-pagination') 
        : document.getElementById('math-pagination');

    paginationContainer.innerHTML = '';
    state.questions.forEach((_, i) => {
        const pageBtn = document.createElement('div');
        pageBtn.className = 'page-btn';
        if (i === state.currentQuestion) pageBtn.classList.add('active');
        pageBtn.textContent = i + 1;
        pageBtn.addEventListener('click', () => {
            state.currentQuestion = i;
            displayQuestion();
            createPagination();
        });
        paginationContainer.appendChild(pageBtn);
    });
}

function displayQuestion() {
    const question = state.questions[state.currentQuestion];
    const questionElement = state.currentSubject === 'science' 
        ? document.getElementById('science-question') 
        : document.getElementById('math-question');
    const imageElement = state.currentSubject === 'science' 
        ? document.getElementById('science-image') 
        : document.getElementById('math-image');
    const optionsElement = state.currentSubject === 'science' 
        ? document.getElementById('science-options') 
        : document.getElementById('math-options');

    const current = state.currentQuestion + 1;
    const total = state.questions.length;
    if (state.currentSubject === 'science') {
        document.getElementById('science-current').textContent = current;
    } else {
        document.getElementById('math-current').textContent = current;
    }

    questionElement.textContent = question.question;
    if (question.image) {
        imageElement.src = question.image;
        imageElement.style.display = 'block';
    } else {
        imageElement.style.display = 'none';
    }

    optionsElement.innerHTML = '';
    question.options.forEach((option, index) => {
        const optionLabel = document.createElement('label');
        optionLabel.className = 'option';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.name = 'option';
        radio.value = index;

        radio.addEventListener('change', () => {
            state.answers[state.currentQuestion] = question.options.indexOf(option);
            if (question.options.indexOf(option) === question.answer) {
                optionLabel.classList.add('correct');
            } else {
                optionLabel.classList.add('wrong');
            }
            setTimeout(() => {
                if (state.currentQuestion < state.questions.length - 1) {
                    state.currentQuestion++;
                    displayQuestion();
                    createPagination();
                } else {
                    submitQuiz();
                }
            }, 800);
        });

        optionLabel.appendChild(radio);
        optionLabel.appendChild(document.createTextNode(option));
        optionsElement.appendChild(optionLabel);
    });

    updateNavigationButtons();
}

function updateNavigationButtons() {
    const isScience = state.currentSubject === 'science';

    const prevButton = isScience ? document.getElementById('science-prev') : document.getElementById('math-prev');
    const nextButton = isScience ? document.getElementById('science-next') : document.getElementById('math-next');
    const submitButton = isScience ? document.getElementById('science-submit') : document.getElementById('math-submit');

    const current = state.currentQuestion;
    const total = state.questions.length;

    // Hide all buttons initially
    prevButton.style.display = 'none';
    nextButton.style.display = 'none';
    submitButton.style.display = 'none';

    // First question: show only Next if answered
    if (current === 0) {
        if (state.answers[current] !== undefined) {
            nextButton.style.display = 'inline-block';
        }
    }
    // Last question: show Previous + Submit if answered
    else if (current === total - 1) {
        prevButton.style.display = 'inline-block';
        if (state.answers[current] !== undefined) {
            submitButton.style.display = 'inline-block';
        }
    }
    // Middle questions: show both Previous and Next (if answered)
    else {
        prevButton.style.display = 'inline-block';
        if (state.answers[current] !== undefined) {
            nextButton.style.display = 'inline-block';
        }
    }
}


function allQuestionsAnswered() {
    return state.answers.length === state.questions.length && state.answers.every(a => a !== undefined);
}

function submitQuiz() {
    clearInterval(state.timerInterval);
    const endTime = new Date();
    const elapsed = Math.floor((endTime - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');

    let correctCount = 0;
    state.answers.forEach((ans, i) => {
        if (ans === state.questions[i].answer) correctCount++;
    });

    const score = Math.round((correctCount / state.questions.length) * 100);

    document.getElementById('score').textContent = score;
    document.getElementById('correct-count').textContent = correctCount;
    document.getElementById('total-questions').textContent = state.questions.length;
    document.getElementById('time-taken').textContent = `${minutes}:${seconds}`;

    scienceQuiz.style.display = 'none';
    mathQuiz.style.display = 'none';
    resultsSection.style.display = 'block';
}

function saveScore() {
    const playerName = playerNameInput.value.trim() || 'Anonymous';
    const score = document.getElementById('score').textContent;
    const timeTaken = document.getElementById('time-taken').textContent;

    const entry = {
        name: playerName,
        subject: state.currentSubject,
        score: parseInt(score),
        time: timeTaken,
        date: new Date().toLocaleDateString()
    };

    // Save to localStorage
    state.leaderboard.push(entry);
    state.leaderboard.sort((a, b) => b.score - a.score);
    if (state.leaderboard.length > 10) state.leaderboard = state.leaderboard.slice(0, 10);
    localStorage.setItem('leaderboard', JSON.stringify(state.leaderboard));

    // Save to Firebase
    firebase.database().ref('leaderboard').push(entry)
        .then(() => {
            alert(`Score saved for ${playerName}!`);
            showSection('leaderboard');
        })
        .catch((error) => {
            console.error('Firebase Error:', error);
            alert("Failed to save score to Firebase.");
        });
}

function renderLeaderboard() {
    leaderboardBody.innerHTML = '';

    firebase.database().ref('leaderboard').once('value', snapshot => {
        const data = snapshot.val();
        if (!data) {
            leaderboardBody.innerHTML = '<tr><td colspan="5" style="text-align:center">No scores yet. Be the first!</td></tr>';
            return;
        }

        const entries = Object.values(data).sort((a, b) => b.score - a.score).slice(0, 10);

        entries.forEach((entry, index) => {
            const row = document.createElement('tr');
            if (index === 0) row.classList.add('rank-1');

            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${entry.name}</td>
                <td>${entry.subject.charAt(0).toUpperCase() + entry.subject.slice(1)}</td>
                <td>${entry.score}%</td>
                <td>${entry.time}</td>
            `;
            leaderboardBody.appendChild(row);
        });
    });
}

window.addEventListener('beforeunload', (e) => {
    if (state.startTime && resultsSection.style.display === 'none') {
        e.preventDefault();
        e.returnValue = 'You have an ongoing quiz. Are you sure you want to leave?';
    }
});
