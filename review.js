// --- Review Mode Logic ---

function startReviewMode() {
    // Switch Main Views
    document.getElementById('editor-view').style.display = 'none';
    document.getElementById('review-view').style.display = 'flex';

    // Switch Toolbars
    document.getElementById('file-ops-toolbar').style.display = 'none';
    document.getElementById('edit-title-btn').style.display = 'none';

    // Initialize Review Session
    reviewQueue = currentData.cards.map((_, i) => i);
    // Simple shuffle
    for (let i = reviewQueue.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [reviewQueue[i], reviewQueue[j]] = [reviewQueue[j], reviewQueue[i]];
    }

    reviewIndex = 0;
    sessionStats = { know: 0, review: 0, struggle: 0 };
    renderReviewCard();

    // Reset Timer UI
    stopTimer();
    document.getElementById('timer-setup').style.display = 'inline';
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('timer-start-btn').style.display = 'inline-flex';
    document.getElementById('timer-pause-btn').style.display = 'none';
}

function exitReviewMode() {
    stopTimer();

    // Switch Main Views Back
    document.getElementById('review-view').style.display = 'none';
    document.getElementById('editor-view').style.display = 'flex';

    // Switch Toolbars Back
    document.getElementById('file-ops-toolbar').style.display = 'flex';
    document.getElementById('edit-title-btn').style.display = 'inline-block';

    if (typeof renderList === 'function') renderList();
    if (currentData.cards.length > 0) {
        if (typeof selectCard === 'function') selectCard(selectedIndex > -1 ? selectedIndex : 0);
    }
}

function renderReviewCard() {
    isReviewFlipped = false;
    const reviewFlipper = document.getElementById('review-flipper');
    const reviewFront = document.getElementById('review-front');
    const reviewBack = document.getElementById('review-back');

    reviewFlipper.classList.remove('flipped');

    if (reviewIndex >= reviewQueue.length) {
        // End of deck
        reviewFront.innerHTML = `<h2>Session Complete! 🎉</h2>
        <p>Know: ${sessionStats.know}</p>
        <p>Review: ${sessionStats.review}</p>
        <p>Struggle: ${sessionStats.struggle}</p>`;
        reviewBack.innerHTML = "";
        reviewFlipper.classList.remove('can-flip');
        return;
    }

    reviewFlipper.classList.add('can-flip');
    const cardIdx = reviewQueue[reviewIndex];
    const card = currentData.cards[cardIdx];
    renderCardContent(card, reviewFront, reviewBack);
}

function flipReviewCard() {
        if (reviewIndex < reviewQueue.length) {
        isReviewFlipped = !isReviewFlipped;
        document.getElementById('review-flipper').classList.toggle('flipped', isReviewFlipped);
    }
}

function rateCard(status) {
    if (reviewIndex >= reviewQueue.length) return;

    const cardIdx = reviewQueue[reviewIndex];
    currentData.cards[cardIdx].status = status;
    sessionStats[status]++;

    reviewIndex++;
    renderReviewCard();
}

// --- Timer Logic ---

function startTimer() {
    const mins = parseInt(document.getElementById('timer-input').value);
    if (isNaN(mins) || mins <= 0) return;

    // Setup UI for running state
    document.getElementById('timer-setup').style.display = 'none';
    document.getElementById('timer-display').style.display = 'inline';
    document.getElementById('timer-start-btn').style.display = 'none';
    document.getElementById('timer-pause-btn').style.display = 'inline-flex';
    document.getElementById('timer-stop-btn').disabled = false;

    // If starting fresh
    if (timeRemaining === 0) {
        timeRemaining = mins * 60;
    }

    updateTimerDisplay();

    timerInterval = setInterval(() => {
        timeRemaining--;
        updateTimerDisplay();
        if (timeRemaining <= 0) {
            stopTimer();
            alert("Time's up! Good study session.");
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    document.getElementById('timer-start-btn').style.display = 'inline-flex';
    document.getElementById('timer-pause-btn').style.display = 'none';
}

function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    timeRemaining = 0;

    // Reset UI
    document.getElementById('timer-setup').style.display = 'inline';
    document.getElementById('timer-display').style.display = 'none';
    document.getElementById('timer-start-btn').style.display = 'inline-flex';
    document.getElementById('timer-pause-btn').style.display = 'none';
    document.getElementById('timer-stop-btn').disabled = true;
}

function updateTimerDisplay() {
    const m = Math.floor(timeRemaining / 60);
    const s = timeRemaining % 60;
    document.getElementById('timer-display').textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}