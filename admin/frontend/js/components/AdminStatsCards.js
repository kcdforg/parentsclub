/**
 * AdminStatsCards Component
 * Reusable statistics cards for admin dashboard
 */

export class AdminStatsCards {
    constructor() {
        this.defaultCards = [
            {
                id: 'totalUsers',
                title: 'Total Users',
                icon: 'fas fa-users',
                iconColor: 'text-blue-500',
                value: 0
            },
            {
                id: 'pendingApprovals',
                title: 'Pending Approvals',
                icon: 'fas fa-clock',
                iconColor: 'text-yellow-500',
                value: 0
            },
            {
                id: 'approvedUsers',
                title: 'Approved Users',
                icon: 'fas fa-check-circle',
                iconColor: 'text-green-500',
                value: 0
            },
            {
                id: 'activeSubscriptions',
                title: 'Active Subscriptions',
                icon: 'fas fa-crown',
                iconColor: 'text-purple-500',
                value: 0
            }
        ];
    }

    /**
     * Generates HTML for a single stats card
     */
    generateCardHTML(card) {
        return `
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="${card.icon} text-2xl ${card.iconColor}"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">${card.title}</dt>
                                <dd class="text-lg font-medium text-gray-900" id="${card.id}">${card.value}</dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Generates HTML for all default stats cards
     */
    generateDefaultCardsHTML() {
        return `
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                ${this.defaultCards.map(card => this.generateCardHTML(card)).join('')}
            </div>
        `;
    }

    /**
     * Generates HTML for custom stats cards
     */
    generateCustomCardsHTML(cards, columns = 4) {
        const gridCols = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 md:grid-cols-2',
            3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
            5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
            6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
        };

        return `
            <div class="grid ${gridCols[columns] || gridCols[4]} gap-6 mb-8">
                ${cards.map(card => this.generateCardHTML(card)).join('')}
            </div>
        `;
    }

    /**
     * Renders default stats cards to a container
     */
    renderDefaultCards(containerId) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateDefaultCardsHTML();
        } else {
            console.error(`Container with ID '${containerId}' not found`);
        }
    }

    /**
     * Renders custom stats cards to a container
     */
    renderCustomCards(containerId, cards, columns = 4) {
        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = this.generateCustomCardsHTML(cards, columns);
        } else {
            console.error(`Container with ID '${containerId}' not found`);
        }
    }

    /**
     * Updates the value of a specific stats card
     */
    updateCardValue(cardId, value) {
        const cardElement = document.getElementById(cardId);
        if (cardElement) {
            cardElement.textContent = value;
        } else {
            console.warn(`Stats card with ID '${cardId}' not found`);
        }
    }

    /**
     * Updates multiple card values at once
     */
    updateMultipleCards(updates) {
        Object.entries(updates).forEach(([cardId, value]) => {
            this.updateCardValue(cardId, value);
        });
    }

    /**
     * Animates a card value change
     */
    animateCardValue(cardId, newValue, duration = 1000) {
        const cardElement = document.getElementById(cardId);
        if (!cardElement) {
            console.warn(`Stats card with ID '${cardId}' not found`);
            return;
        }

        const currentValue = parseInt(cardElement.textContent) || 0;
        const difference = newValue - currentValue;
        const steps = 60; // 60 steps for smooth animation
        const stepValue = difference / steps;
        const stepDuration = duration / steps;

        let currentStep = 0;

        const updateStep = () => {
            currentStep++;
            const value = Math.round(currentValue + (stepValue * currentStep));
            cardElement.textContent = value;

            if (currentStep < steps) {
                setTimeout(updateStep, stepDuration);
            } else {
                cardElement.textContent = newValue; // Ensure final value is exact
            }
        };

        updateStep();
    }

    /**
     * Adds a loading state to all cards
     */
    showLoadingState() {
        this.defaultCards.forEach(card => {
            const cardElement = document.getElementById(card.id);
            if (cardElement) {
                cardElement.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            }
        });
    }

    /**
     * Removes loading state and shows values
     */
    hideLoadingState(values = {}) {
        this.defaultCards.forEach(card => {
            const cardElement = document.getElementById(card.id);
            if (cardElement) {
                const value = values[card.id] !== undefined ? values[card.id] : card.value;
                cardElement.textContent = value;
            }
        });
    }

    /**
     * Creates a compact stats card for smaller spaces
     */
    generateCompactCardHTML(card) {
        return `
            <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-xs font-medium text-gray-500 uppercase tracking-wider">${card.title}</p>
                        <p class="text-xl font-semibold text-gray-900" id="${card.id}">${card.value}</p>
                    </div>
                    <div class="p-2 bg-gray-50 rounded-lg">
                        <i class="${card.icon} ${card.iconColor}"></i>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Renders compact stats cards
     */
    renderCompactCards(containerId, cards, columns = 2) {
        const gridCols = {
            1: 'grid-cols-1',
            2: 'grid-cols-1 sm:grid-cols-2',
            3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
            4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
        };

        const container = document.getElementById(containerId);
        if (container) {
            container.innerHTML = `
                <div class="grid ${gridCols[columns] || gridCols[2]} gap-4">
                    ${cards.map(card => this.generateCompactCardHTML(card)).join('')}
                </div>
            `;
        } else {
            console.error(`Container with ID '${containerId}' not found`);
        }
    }

    /**
     * Creates a trend card that shows percentage change
     */
    generateTrendCardHTML(card) {
        const trendIcon = card.trend > 0 ? 'fas fa-arrow-up' : card.trend < 0 ? 'fas fa-arrow-down' : 'fas fa-minus';
        const trendColor = card.trend > 0 ? 'text-green-500' : card.trend < 0 ? 'text-red-500' : 'text-gray-500';
        const trendBg = card.trend > 0 ? 'bg-green-50' : card.trend < 0 ? 'bg-red-50' : 'bg-gray-50';

        return `
            <div class="bg-white overflow-hidden shadow rounded-lg">
                <div class="p-5">
                    <div class="flex items-center">
                        <div class="flex-shrink-0">
                            <i class="${card.icon} text-2xl ${card.iconColor}"></i>
                        </div>
                        <div class="ml-5 w-0 flex-1">
                            <dl>
                                <dt class="text-sm font-medium text-gray-500 truncate">${card.title}</dt>
                                <dd class="text-lg font-medium text-gray-900" id="${card.id}">${card.value}</dd>
                                <dd class="mt-1 flex items-center text-sm">
                                    <div class="flex items-center ${trendColor}">
                                        <i class="${trendIcon} mr-1"></i>
                                        <span class="font-medium">${Math.abs(card.trend)}%</span>
                                    </div>
                                    <span class="ml-2 text-gray-500">${card.trendPeriod || 'vs last month'}</span>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

/**
 * Quick function to create and render default admin stats cards
 */
export function createDefaultStatsCards(containerId) {
    const statsCards = new AdminStatsCards();
    statsCards.renderDefaultCards(containerId);
    return statsCards;
}

/**
 * Quick function to create and render custom stats cards
 */
export function createCustomStatsCards(containerId, cards, columns = 4) {
    const statsCards = new AdminStatsCards();
    statsCards.renderCustomCards(containerId, cards, columns);
    return statsCards;
}
