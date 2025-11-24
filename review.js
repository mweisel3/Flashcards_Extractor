// --- Review Mode Logic ---

function startReviewMode(filteredQueue) {
    // Switch Main Views
    document.getElementById('editor-view').style.display = 'none';
    document.getElementById('review-view').style.display = 'flex';

    // Switch Toolbars
    document.getElementById('file-ops-toolbar').style.display = 'none';
    document.getElementById('edit-title-btn').style.display = 'none';

    // Initialize Review Session
    if (filteredQueue) {
        reviewQueue = filteredQueue;
    } else {
        reviewQueue = currentData.cards.map((_, i) => i);
        // Simple shuffle only for full deck review
        for (let i = reviewQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [reviewQueue[i], reviewQueue[j]] = [reviewQueue[j], reviewQueue[i]];
        }
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

    // Reset toggle switch if exiting manually
    document.getElementById('mode-toggle').checked = false;

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
        reviewFront.innerHTML = `
            <h2>Session Complete! 🎉</h2>
            <p>Know: ${sessionStats.know}</p>
            <p>Review: ${sessionStats.review}</p>
            <p>Struggle: ${sessionStats.struggle}</p>
            <div class="sub-deck-options">
                <button class="btn btn-secondary" onclick="reviewSubDeck(['review', 'struggle'])">Review Weak Cards</button>
                <button class="btn btn-primary" onclick="startReviewMode()">Restart Full Deck</button>
            </div>
        `;
        reviewBack.innerHTML = "";
        reviewFlipper.classList.remove('can-flip');

        // Hide navigation/counter at end
        // Using innerHTML overwrite above clears them from previous card
        return;
    }

    reviewFlipper.classList.add('can-flip');
    const cardIdx = reviewQueue[reviewIndex];
    const card = currentData.cards[cardIdx];
    renderCardContent(card, reviewFront, reviewBack);

    // Add Counter
    const counter = document.createElement('div');
    counter.className = 'card-counter';
    counter.textContent = `${reviewIndex + 1} / ${reviewQueue.length}`;
    reviewFront.appendChild(counter);

    // Add Navigation
    const nav = document.createElement('div');
    nav.className = 'card-navigation';
    nav.innerHTML = `
        <button class="nav-btn" onclick="prevCard(event)" title="Previous Card">⬅️</button>
        <button class="nav-btn" onclick="nextCard(event)" title="Next Card">➡️</button>
    `;
    // Stop propagation so clicking nav buttons doesn't flip card
    nav.addEventListener('click', (e) => e.stopPropagation());
    reviewFront.appendChild(nav);
}

function prevCard(event) {
    if (event) event.stopPropagation();
    if (reviewIndex > 0) {
        reviewIndex--;
        renderReviewCard();
    }
}

function nextCard(event) {
    if (event) event.stopPropagation();
    if (reviewIndex < reviewQueue.length - 1) {
        reviewIndex++;
        renderReviewCard();
    }
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

function reviewSubDeck(statuses) {
    // Filter cards based on their current status
    const newQueue = currentData.cards
        .map((card, index) => ({ card, index }))
        .filter(item => statuses.includes(item.card.status))
        .map(item => item.index);

    if (newQueue.length === 0) {
        alert("No cards found matching those criteria!");
        return;
    }

    startReviewMode(newQueue);
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