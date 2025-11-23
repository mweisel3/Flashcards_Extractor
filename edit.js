// --- UI Rendering ---

function renderList() {
    const cardList = document.getElementById('card-list');
    const cardCount = document.getElementById('card-count');
    const listEmptyState = document.getElementById('list-empty-state');
    const selectModeBtn = document.getElementById('select-mode-btn');
    const modeSwitch = document.getElementById('mode-switch-container');

    cardList.innerHTML = ''; // Clear the list
    cardCount.textContent = `${currentData.cards.length} cards`;

    // Handle Empty State
    if (currentData.cards.length === 0) {
         listEmptyState.style.display = 'block'; // Show the div
         selectModeBtn.disabled = true;
         modeSwitch.classList.remove('active');
         return;
    }

    listEmptyState.style.display = 'none'; // Hide the div
    selectModeBtn.disabled = false;
    modeSwitch.classList.add('active');

    currentData.cards.forEach((card, index) => {
        const li = document.createElement('li');
        li.className = 'list-item';
        if (index === selectedIndex && !isSelectMode) li.classList.add('active');
        if (isSelectMode && selectedForDelete.has(index)) li.classList.add('selected-for-delete');

        // Status Indicator
        if (card.status) {
            const dot = document.createElement('div');
            dot.className = `status-dot status-${card.status}`;
            li.appendChild(dot);
        }

        let previewText = currentData.type === 'flashcards' ? card.front : card.question;
        const textSpan = document.createElement('span');
        textSpan.textContent = (index + 1) + ". " + (previewText || "Untitled Card");
        textSpan.style.overflow = 'hidden';
        textSpan.style.textOverflow = 'ellipsis';
        li.appendChild(textSpan);

        li.onclick = () => isSelectMode ? toggleDeleteSelection(index) : selectCard(index);
        cardList.appendChild(li);
    });
}

function selectCard(index) {
    selectedIndex = index;
    isFlipped = false;
    document.getElementById('editor-flipper').classList.remove('flipped');
    renderList();
    renderActiveCard();
}

function renderActiveCard() {
    const flipperEmptyState = document.getElementById('flipper-empty-state');
    const frontContent = document.getElementById('front-content');
    const backContent = document.getElementById('back-content');
    const editorFlipper = document.getElementById('editor-flipper');
    const flipBtn = document.getElementById('flip-btn');
    const editBtn = document.getElementById('edit-btn');
    const deleteBtn = document.getElementById('delete-btn');

    if (selectedIndex < 0 || selectedIndex >= currentData.cards.length) {
        flipperEmptyState.style.display = 'block';
        frontContent.innerHTML = '';
        frontContent.appendChild(flipperEmptyState);
        backContent.innerHTML = '';
        editorFlipper.classList.remove('can-flip');
        flipBtn.disabled = editBtn.disabled = deleteBtn.disabled = true;
        return;
    }

    flipperEmptyState.style.display = 'none';
    editorFlipper.classList.add('can-flip');
    flipBtn.disabled = editBtn.disabled = deleteBtn.disabled = false;

    const card = currentData.cards[selectedIndex];
    renderCardContent(card, frontContent, backContent);
}

function flipCard() {
    if (selectedIndex >= 0) {
        isFlipped = !isFlipped;
        document.getElementById('editor-flipper').classList.toggle('flipped', isFlipped);
    }
}

// --- Modals & Editing ---

let isEditing = false;
const cardModal = document.getElementById('card-modal');
const typeSelectModal = document.getElementById('type-select-modal');

function setDeckType(type) {
    currentData.type = type;
    typeSelectModal.classList.remove('active');
    if (currentData.title === "New Deck") {
         document.getElementById('edit-title-btn').click(); // Trigger title edit
    }
    document.getElementById('save-btn').disabled = false;
    openAddModal();
}

function openAddModal() {
    if (currentData.type === null) { typeSelectModal.classList.add('active'); return; }
    isEditing = false;
    document.getElementById('modal-title').textContent = "Add New Card";
    clearModalInputs();
    showCorrectModalForm();
    cardModal.classList.add('active');
}

function openEditModal() {
    if (selectedIndex < 0) return;
    isEditing = true;
    document.getElementById('modal-title').textContent = "Edit Card";
    const card = currentData.cards[selectedIndex];
    if (currentData.type === 'flashcards') {
        document.getElementById('edit-front').value = card.front || "";
        document.getElementById('edit-back').value = card.back || "";
    } else {
            document.getElementById('edit-question').value = card.question || "";
    }
    showCorrectModalForm();
    cardModal.classList.add('active');
}

function showCorrectModalForm() {
        document.getElementById('modal-form-flashcard').style.display = currentData.type === 'flashcards' ? 'block' : 'none';
        document.getElementById('modal-form-quiz').style.display = currentData.type === 'quiz' ? 'block' : 'none';
}

function closeModal() { cardModal.classList.remove('active'); }

function clearModalInputs() {
    document.getElementById('edit-front').value = "";
    document.getElementById('edit-back').value = "";
    document.getElementById('edit-question').value = "";
}

function saveCard() {
    let newCard = {};
    if (isEditing) newCard = { ...currentData.cards[selectedIndex] };
    if (currentData.type === 'flashcards') {
        newCard.front = document.getElementById('edit-front').value;
        newCard.back = document.getElementById('edit-back').value;
    } else {
        newCard.question = document.getElementById('edit-question').value;
        if (!isEditing) { newCard.options = []; newCard.answer = ""; }
    }
    if (isEditing) currentData.cards[selectedIndex] = newCard;
    else { currentData.cards.push(newCard); selectedIndex = currentData.cards.length - 1; }
    document.getElementById('save-btn').disabled = false;
    closeModal();
    renderList();
    selectCard(selectedIndex);
}

function deleteCurrentCard() {
    if (selectedIndex < 0) return;
    if (confirm("Delete this card?")) {
        currentData.cards.splice(selectedIndex, 1);
        document.getElementById('save-btn').disabled = false;
        if (currentData.cards.length === 0) selectedIndex = -1;
        else if (selectedIndex >= currentData.cards.length) selectedIndex = currentData.cards.length - 1;
        renderList();
        if(selectedIndex > -1) selectCard(selectedIndex);
        else renderActiveCard();
    }
}

// --- Bulk Delete ---

function toggleSelectMode() {
    isSelectMode = !isSelectMode;
    const selectModeBtn = document.getElementById('select-mode-btn');
    const bulkDeleteBtn = document.getElementById('bulk-delete-btn');
    const addCardBtn = document.getElementById('add-card-btn');

    if (isSelectMode) {
        selectModeBtn.innerHTML = "❌";
        selectModeBtn.title = "Cancel Select Mode";
        bulkDeleteBtn.style.display = "inline-flex";
        bulkDeleteBtn.disabled = true;
        addCardBtn.disabled = true;
        selectedIndex = -1;
        renderActiveCard();
    } else {
        selectModeBtn.innerHTML = "☑️";
        selectModeBtn.title = "Select Multiple";
        bulkDeleteBtn.style.display = "none";
        addCardBtn.disabled = false;
        selectedForDelete.clear();
    }
    renderList();
}

function toggleDeleteSelection(index) {
    if (selectedForDelete.has(index)) selectedForDelete.delete(index);
    else selectedForDelete.add(index);
    document.getElementById('bulk-delete-btn').disabled = (selectedForDelete.size === 0);
    renderList();
}

function bulkDelete() {
        const count = selectedForDelete.size;
        if (count === 0) return;
        if (confirm(`Delete ${count} cards?`)) {
        const indices = Array.from(selectedForDelete).sort((a, b) => b - a);
        indices.forEach(idx => currentData.cards.splice(idx, 1));
        document.getElementById('save-btn').disabled = false;
        toggleSelectMode();
        if (currentData.cards.length > 0) selectCard(0);
        }
}