// --- Global State ---
let currentData = { title: "New Deck", type: null, cards: [] };
// These are used in edit.js
let selectedIndex = -1;
let isFlipped = false;
let isSelectMode = false;
let selectedForDelete = new Set();
// These are used in review.js
let reviewQueue = [];
let reviewIndex = 0;
let isReviewFlipped = false;
let timerInterval = null;
let timeRemaining = 0;
let sessionStats = { know: 0, review: 0, struggle: 0 };

// --- Helper Functions ---

function renderCardContent(card, frontEl, backEl) {
    if (currentData.type === 'flashcards') {
        frontEl.textContent = card.front;
        backEl.textContent = card.back;
    } else {
        frontEl.textContent = "Q: " + (card.question || "");
        let optionsHtml = '<div class="quiz-options">';
        if (card.options) {
            card.options.forEach(opt => {
                 const isCorrectClass = opt.isCorrect ? 'correct' : '';
                 optionsHtml += `<div class="quiz-option ${isCorrectClass}">${opt.text}</div>`;
            });
        }
        optionsHtml += '</div>';
        if (card.answer) optionsHtml += `<p><strong>Rationale:</strong> ${card.answer}</p>`;
        backEl.innerHTML = optionsHtml;
    }
}

// --- File Handling ---

function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const loadedData = JSON.parse(e.target.result);
            loadDeck(loadedData);
        } catch (error) { alert("Error parsing JSON file: " + error.message); }
    };
    reader.readAsText(file);
}

function loadDeck(data) {
    if (isSelectMode && typeof toggleSelectMode === 'function') toggleSelectMode();

    if (data.flashcards) {
        currentData = { title: data.title, type: 'flashcards', cards: data.flashcards || [] };
    } else if (data.quiz) {
        currentData = { title: data.title, type: 'quiz', cards: data.quiz || [] };
    } else {
        alert("Invalid file format."); return;
    }

    document.getElementById('deck-title').textContent = currentData.title || "Untitled Deck";
    document.getElementById('save-btn').disabled = false;

    // Enable the switch
    document.getElementById('mode-switch-container').classList.add('active');
    document.getElementById('mode-toggle').checked = false; // Reset to Edit

    selectedIndex = -1;

    // Call render functions from edit.js
    if (typeof renderList === 'function') renderList();
    if (currentData.cards.length > 0) {
        if (typeof selectCard === 'function') selectCard(0);
    } else {
        if (typeof renderActiveCard === 'function') renderActiveCard();
    }
}

function downloadData() {
    const exportData = { title: currentData.title };
    const key = currentData.type === 'flashcards' ? 'flashcards' : 'quiz';
    exportData[key] = currentData.cards;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    const safeTitle = (currentData.title || "deck").replace(/[<>:"/\\|?*]+/g, '_');
    downloadAnchorNode.setAttribute("download", safeTitle + ".json");
    downloadAnchorNode.setAttribute("href", dataStr);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// --- Initialization ---
window.addEventListener('DOMContentLoaded', () => {
    // Bind Header Events
    document.getElementById('file-upload').addEventListener('change', handleFileUpload);

    document.getElementById('edit-title-btn').addEventListener('click', () => {
        const newTitle = prompt("Enter new deck title:", currentData.title);
        if (newTitle) {
            currentData.title = newTitle;
            document.getElementById('deck-title').textContent = newTitle;
            document.getElementById('save-btn').disabled = false;
        }
    });

    // Handle Toggle Switch
    document.getElementById('mode-toggle').addEventListener('change', (e) => {
        if (e.target.checked) {
            if (typeof startReviewMode === 'function') startReviewMode();
        } else {
            if (typeof exitReviewMode === 'function') exitReviewMode();
        }
    });

    // Initial UI State
    if (typeof renderActiveCard === 'function') renderActiveCard();
});