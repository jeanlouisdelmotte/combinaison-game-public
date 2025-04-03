document.addEventListener('DOMContentLoaded', () => {
    const firebaseConfig = {
        apiKey: "AIzaSyBuFLI9BEjdHmyplBcprSKSdCHCtv8hxtw",
        authDomain: "combinaison-game-db.firebaseapp.com",
        databaseURL: "https://combinaison-game-db-default-rtdb.europe-west1.firebasedatabase.app/",
        projectId: "combinaison-game-db",
        storageBucket: "combinaison-game-db.appspot.com",
        messagingSenderId: "821232649609",
        appId: "1:821232649609:web:507734fcc2b4aa8a4d8d58"
    };

    const app = firebase.initializeApp(firebaseConfig);
    const database = firebase.database();

    const homeScreen = document.getElementById('home-screen');
    const gameScreen = document.getElementById('game-screen');
    const resultScreen = document.getElementById('result-screen');
    const leaderboardScreen = document.getElementById('leaderboard-screen');
    const difficultyButtons = document.querySelectorAll('.difficulty-btn');
    const timerElement = document.getElementById('timer');
    const instructionElement = document.getElementById('instruction');
    const scoreElement = document.getElementById('score');
    const feedbackElement = document.getElementById('feedback');
    const finalScoreElement = document.getElementById('final-score');
    const playerNameInput = document.getElementById('player-name');
    const saveScoreButton = document.getElementById('save-score-button');
    const leaderboardElement = document.getElementById('leaderboard').querySelector('tbody');
    const replayButton = document.getElementById('replay-button');
    const returnHomeButton = document.getElementById('return-home-button');
    const tutorialBtn = document.getElementById('tutorial-btn');
    const backBtn = document.getElementById('back-btn');
    const tutorialScreen = document.getElementById('tutorial-screen');
    const leaderboardTabs = document.querySelectorAll('.leaderboard-tab');

    let score = 0;
    let timer = 10;
    let currentInstruction = '';
    let interval;
    let ctrlPressed = false;
    let shiftPressed = false;
    let currentDifficulty = 'easy';
    let instructions = [];

    const difficultySettings = {
        easy: {
            time: 10,
            instructions: ['Copier', 'Coller', 'Couper', 'Annuler', 'Sauvegarder']
        },
        medium: {
            time: 15,
            instructions: ['Copier', 'Coller', 'Couper', 'Annuler', 'Sauvegarder', 'Sélectionner tout', 'Refaire', 'Rechercher']
        },
        hard: {
            time: 20,
            instructions: ['Copier', 'Coller', 'Couper', 'Annuler', 'Sauvegarder', 'Sélectionner tout', 'Refaire', 'Rechercher', 'Imprimer', 'Remplacer', 'Ouvrir']
        },
        extreme: {
            time: 30,
            instructions: ['Copier', 'Coller', 'Couper', 'Annuler', 'Sauvegarder', 'Sélectionner tout', 'Refaire', 'Rechercher', 'Imprimer', 'Remplacer', 'Ouvrir', 'Gras', 'Italique', 'Souligner', 'Aller à la Fin', 'Aller au Début', 'Sélectionner le mot à gauche', 'Sélectionner le mot à droite']
        }
    };

    const combinaisons = {
        'Copier': 'c',
        'Coller': 'v',
        'Couper': 'x',
        'Annuler': 'z',
        'Sauvegarder': 's',
        'Sélectionner tout': 'a',
        'Refaire': 'y',
        'Rechercher': 'f',
        'Imprimer': 'p',
        'Remplacer': 'h',
        'Ouvrir': 'o',
        'Gras': 'b',
        'Italique': 'i',
        'Souligner': 'u',
        'Aller à la Fin': 'end',
        'Aller au Début': 'home',
        'Sélectionner le mot à gauche': 'arrowleft',
        'Sélectionner le mot à droite': 'arrowright'
    };

    function startGame(difficulty) {
        currentDifficulty = difficulty;
        instructions = difficultySettings[difficulty].instructions;
        timer = difficultySettings[difficulty].time;

        homeScreen.style.display = 'none';
        gameScreen.style.display = 'block';
        score = 0;
        timerElement.textContent = timer;
        scoreElement.textContent = `Score: ${score}`;
        feedbackElement.textContent = '';
        setNewInstruction();
        interval = setInterval(updateTimer, 1000);
    }

    function updateTimer() {
        timer--;
        timerElement.textContent = timer;
        if (timer <= 0) {
            clearInterval(interval);
            endGame();
        }
    }

    function setNewInstruction() {
        const randomIndex = Math.floor(Math.random() * instructions.length);
        currentInstruction = instructions[randomIndex];
        instructionElement.textContent = currentInstruction;

        // Ajouter la classe pour l'animation
        instructionElement.classList.add('highlight');

        // Retirer la classe après l'animation pour permettre de la réutiliser
        setTimeout(() => {
            instructionElement.classList.remove('highlight');
        }, 200); // Durée de l'animation
    }

    function endGame() {
        gameScreen.style.display = 'none';
        resultScreen.style.display = 'block';
        finalScoreElement.textContent = `Votre score : ${score}`;
        // Ne pas afficher le leaderboard automatiquement à la fin du jeu
    }

    function formatDate(date) {
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Europe/Paris'
        });
    }

    function saveScore() {
        const playerName = playerNameInput.value.trim();
        if (playerName) {
            // Sauvegarder le score dans Firebase avec la date formatée
            const scoresRef = firebase.database().ref(`scores/${currentDifficulty}`);
            const newScoreRef = scoresRef.push();
            newScoreRef.set({
                name: playerName,
                score: score,
                date: formatDate(new Date())
            });

            // Récupérer et afficher les scores
            fetchScores(currentDifficulty);
            resultScreen.style.display = 'none';
            leaderboardScreen.style.display = 'block';
        }
    }

    function fetchScores(difficulty) {
        const scoresRef = firebase.database().ref(`scores/${difficulty}/`);
        scoresRef.on('value', (snapshot) => {
            const data = snapshot.val();
            const scores = Object.keys(data).map(key => ({
                id: key,
                name: data[key].name,
                score: data[key].score,
                date: data[key].date
            }));
            showLeaderboard(scores, difficulty);
        });
    }

    function showLeaderboard(scores, difficulty) {
        leaderboardElement.innerHTML = '';
        scores.sort((a, b) => b.score - a.score);
        scores.forEach((score, index) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="${index === 0 ? 'first' : index === 1 ? 'second' : index === 2 ? 'third' : ''}">${index + 1}</td>
                <td>${score.name}</td>
                <td>${score.score}</td>
                <td>${score.date}</td>
            `;
            leaderboardElement.appendChild(tr);
        });
        // Afficher le titre du niveau de difficulté
        document.querySelector('#leaderboard-screen h1').textContent = `Classement des Meilleurs Scores - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
    }

    function replayGame() {
        leaderboardScreen.style.display = 'none';
        homeScreen.style.display = 'block';
    }

    function returnToHome() {
        resultScreen.style.display = 'none';
        homeScreen.style.display = 'block';
    }

    difficultyButtons.forEach(button => {
        button.addEventListener('click', () => {
            const difficulty = button.getAttribute('data-difficulty');
            startGame(difficulty);
        });
    });

    saveScoreButton.addEventListener('click', saveScore);
    replayButton.addEventListener('click', replayGame);
    returnHomeButton.addEventListener('click', returnToHome);

    leaderboardTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const difficulty = tab.getAttribute('data-difficulty');
            fetchScores(difficulty);
        });
    });

    document.addEventListener('keydown', event => {
        if (event.key === 'Control') {
            ctrlPressed = true;
        }
        if (event.key === 'Shift') {
            shiftPressed = true;
        }
        if (gameScreen.style.display === 'block' && event.key !== 'Control' && event.key !== 'Shift') {
            const expectedKey = combinaisons[currentInstruction];
            const isCtrlRequired = !['Aller à la Fin', 'Aller au Début'].includes(currentInstruction);
            const isShiftRequired = ['Sélectionner le mot à gauche', 'Sélectionner le mot à droite'].includes(currentInstruction);

            if ((isCtrlRequired && ctrlPressed && !isShiftRequired && event.key.toLowerCase() === expectedKey) ||
                (!isCtrlRequired && event.code.toLowerCase() === expectedKey) ||
                (isShiftRequired && ctrlPressed && shiftPressed && event.code.toLowerCase() === expectedKey)) {
                score++;
                feedbackElement.textContent = 'Correct!';
                feedbackElement.className = 'correct';
            } else {
                score--;
                feedbackElement.textContent = 'Incorrect!';
                feedbackElement.className = 'incorrect';
            }
            scoreElement.textContent = `Score: ${score}`;
            setNewInstruction();
            event.preventDefault();
        }
    });

    document.addEventListener('keyup', event => {
        if (event.key === 'Control') {
            ctrlPressed = false;
        }
        if (event.key === 'Shift') {
            shiftPressed = false;
        }
    });

    // Désactiver les raccourcis clavier du navigateur
    document.addEventListener('keydown', event => {
        if (event.ctrlKey && ['c', 'v', 's', 'a', 'z', 'y', 'f', 'p', 'h', 'o', 'b', 'i', 'u'].includes(event.key)) {
            event.preventDefault();
        }
    });

    tutorialBtn.addEventListener('click', () => {
        homeScreen.style.display = 'none';
        tutorialScreen.style.display = 'block';
    });

    backBtn.addEventListener('click', () => {
        tutorialScreen.style.display = 'none';
        homeScreen.style.display = 'block';
    });
});
