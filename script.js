document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('login-form');
    const addCardForm = document.getElementById('add-card-form');
    const loginPage = document.getElementById('login-page');
    const dashboard = document.getElementById('dashboard');
    const addCardSection = document.getElementById('add-card-section');
    const cardsContainer = document.getElementById('cards-container');
    const addCardBtn = document.getElementById('add-card-btn');

    const clientNameInput = document.getElementById('client-name');
    const cardNameInput = document.getElementById('card-name');
    const dueDateInput = document.getElementById('due-date');
    const cardLimitInput = document.getElementById('card-limit');

    const displayClientName = document.getElementById('display-client-name');

    let cards = JSON.parse(localStorage.getItem('cards')) || [];
    let clientName = localStorage.getItem('clientName') || '';

    if (clientName && cards.length > 0) {
        loadDashboard();
    }

    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        clientName = clientNameInput.value;
        const cardName = cardNameInput.value;
        const dueDate = dueDateInput.value;
        const cardLimit = parseFloat(cardLimitInput.value);

        const card = createCard(cardName, dueDate, cardLimit);
        cards.push(card);

        localStorage.setItem('clientName', clientName);
        localStorage.setItem('cards', JSON.stringify(cards));

        loadDashboard();
    });

    addCardForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const cardName = document.getElementById('new-card-name').value;
        const dueDate = document.getElementById('new-due-date').value;
        const cardLimit = parseFloat(document.getElementById('new-card-limit').value);

        const card = createCard(cardName, dueDate, cardLimit);
        cards.push(card);

        localStorage.setItem('cards', JSON.stringify(cards));
        updateDashboard();
        addCardForm.reset();
        addCardSection.style.display = 'none';
    });

    addCardBtn.addEventListener('click', function() {
        addCardSection.style.display = 'block';
    });

    function createCard(cardName, dueDate, cardLimit) {
        return {
            cardName: cardName,
            dueDate: dueDate,
            limit: cardLimit,
            bill: 0.00,
            purchases: []
        };
    }

    function loadDashboard() {
        displayClientName.textContent = clientName;
        updateDashboard();

        loginPage.style.display = 'none';
        dashboard.style.display = 'block';
        
    }

    function updateDashboard() {
        cardsContainer.innerHTML = '';

        cards.forEach((card, cardIndex) => {
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card-box';

            const daysUntilDue = calculateDaysUntilDue(card.dueDate);

            cardDiv.innerHTML = `
                <div class="card-info">
                    <h3>${card.cardName}</h3>
                    <p>Data de Vencimento: ${card.dueDate} (Faltam ${daysUntilDue} dias)</p>
                    <p>Limite Disponível: R$<span class="available-limit">${card.limit.toFixed(2)}</span></p>
                    <p>Valor da Fatura: R$<span class="bill-amount">${card.bill.toFixed(2)}</span></p>
                </div>
                <button class="pay-button">${daysUntilDue > 6 ? 'Adiantar Fatura' : 'Pagar Fatura'}</button>
                <h3>Compras</h3>
                <ul class="purchase-list" data-card-index="${cardIndex}"></ul>
                <h3>Adicionar Compra</h3>
                <form class="add-purchase-form" data-card-index="${cardIndex}">
                    <label for="purchase-description-${cardIndex}">Descrição:</label>
                    <input type="text" id="purchase-description-${cardIndex}" required>
                    
                    <label for="purchase-amount-${cardIndex}">Valor:</label>
                    <input type="number" id="purchase-amount-${cardIndex}" required>
                    
                    <button type="submit">Adicionar</button>
                </form>
            `;

            cardsContainer.appendChild(cardDiv);

            const purchaseList = cardDiv.querySelector('.purchase-list');
            card.purchases.forEach((purchase, purchaseIndex) => {
                const li = document.createElement('li');
                li.className = 'purchase-item';
                li.innerHTML = `${purchase.description}: R$${purchase.amount.toFixed(2)} <button data-card-index="${cardIndex}" data-purchase-index="${purchaseIndex}">Apagar</button>`;
                purchaseList.appendChild(li);
            });

            cardDiv.querySelector('.add-purchase-form').addEventListener('submit', function(event) {
                event.preventDefault();
                const cardIndex = event.target.dataset.cardIndex;
                const description = event.target.querySelector(`#purchase-description-${cardIndex}`).value;
                const amount = parseFloat(event.target.querySelector(`#purchase-amount-${cardIndex}`).value);

                const purchase = { description, amount };
                cards[cardIndex].purchases.push(purchase);
                cards[cardIndex].bill += amount;
                cards[cardIndex].limit -= amount;

                localStorage.setItem('cards', JSON.stringify(cards));
                updateDashboard();
            });
        });

        const payButtons = document.querySelectorAll('.pay-button');
        payButtons.forEach((button, index) => {
            button.addEventListener('click', function() {
                const cardIndex = index;
                const daysUntilDue = calculateDaysUntilDue(cards[cardIndex].dueDate);
                if (daysUntilDue > 6) {
                    const amount = parseFloat(prompt("Digite o valor para adiantar a fatura:"));
                    if (!isNaN(amount) && amount > 0) {
                        cards[cardIndex].bill -= amount;
                        cards[cardIndex].limit += amount;

                        localStorage.setItem('cards', JSON.stringify(cards));
                        updateDashboard();
                    } else {
                        alert("Por favor, insira um valor válido para adiantar a fatura.");
                    }
                } else {
                    cards[cardIndex].bill = 0;
                    const currentDate = new Date();
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    const nextDueDate = currentDate.toISOString().split('T')[0];

                    cards[cardIndex].dueDate = nextDueDate;

                    localStorage.setItem('cards', JSON.stringify(cards));
                    updateDashboard();
                }
            });
        });
    }

    cardsContainer.addEventListener('click', function(event) {
        if (event.target.tagName === 'BUTTON' && event.target.textContent === 'Apagar') {
            const cardIndex = event.target.dataset.cardIndex;
            const purchaseIndex = event.target.dataset.purchaseIndex;
            const amount = cards[cardIndex].purchases[purchaseIndex].amount;
            cards[cardIndex].purchases.splice(purchaseIndex, 1);
            cards[cardIndex].bill -= amount;
            cards[cardIndex].limit += amount;

            localStorage.setItem('cards', JSON.stringify(cards));
            updateDashboard();
        }
    });

    function calculateDaysUntilDue(dueDate) {
        const today = new Date();
        const due = new Date(dueDate);
        const timeDiff = due.getTime() - today.getTime();
        const daysUntilDue = Math.ceil(timeDiff / (        1000 * 3600 * 24));
        return daysUntilDue;
    }

    

    
});
