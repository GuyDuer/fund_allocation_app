// Portfolio Save/Load Functionality - Clean Version
class PortfolioSaveLoad {
    constructor(portfolioManager) {
        this.portfolioManager = portfolioManager;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Save modal event listeners
        document.getElementById('save-portfolio-btn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('cancel-save-btn').addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirm-save-btn').addEventListener('click', () => this.savePortfolioProfile());
        
        // Load modal event listeners
        document.getElementById('load-portfolio-btn').addEventListener('click', () => this.showLoadModal());
        document.getElementById('cancel-load-btn').addEventListener('click', () => this.hideLoadModal());
        
        // Save option radio button listeners
        document.getElementById('save-as-new').addEventListener('change', () => this.handleSaveOptionChange());
        document.getElementById('save-as-update').addEventListener('change', () => this.handleSaveOptionChange());
        
        // Enter key support for portfolio name
        document.getElementById('portfolio-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.savePortfolioProfile();
        });
    }

    showSaveModal() {
        document.getElementById('save-modal').classList.remove('hidden');
        document.getElementById('portfolio-name-input').focus();
        
        // Reset to default state
        document.getElementById('save-as-new').checked = true;
        this.handleSaveOptionChange();
    }

    hideSaveModal() {
        document.getElementById('save-modal').classList.add('hidden');
        document.getElementById('portfolio-name-input').value = '';
    }

    handleSaveOptionChange() {
        const isUpdate = document.getElementById('save-as-update').checked;
        const existingSection = document.getElementById('existing-portfolio-section');
        const nameInput = document.getElementById('portfolio-name-input');
        const existingSelect = document.getElementById('existing-portfolio-select');
        
        if (isUpdate) {
            // Show existing portfolio selection
            existingSection.classList.remove('hidden');
            nameInput.disabled = true;
            nameInput.placeholder = 'Will be set when you select a portfolio to update';
            
            // Populate existing portfolios
            this.populateExistingPortfolios();
        } else {
            // Hide existing portfolio selection
            existingSection.classList.add('hidden');
            nameInput.disabled = false;
            nameInput.placeholder = 'e.g., Conservative Portfolio, Growth Strategy';
            nameInput.value = '';
        }
    }

    populateExistingPortfolios() {
        const select = document.getElementById('existing-portfolio-select');
        const nameInput = document.getElementById('portfolio-name-input');
        
        // Clear existing options except the first one
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        try {
            const savedProfiles = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            
            Object.keys(savedProfiles).forEach(profileName => {
                const option = document.createElement('option');
                option.value = profileName;
                option.textContent = profileName;
                select.appendChild(option);
            });
            
            // Add change listener to update name input
            select.onchange = () => {
                nameInput.value = select.value;
            };
            
        } catch (error) {
            console.error('Error loading existing portfolios:', error);
        }
    }

    savePortfolioProfile() {
        const isUpdate = document.getElementById('save-as-update').checked;
        const profileName = document.getElementById('portfolio-name-input').value.trim();
        
        if (!profileName) {
            alert('Please enter a portfolio profile name.');
            return;
        }
        
        if (isUpdate) {
            const selectedPortfolio = document.getElementById('existing-portfolio-select').value;
            if (!selectedPortfolio) {
                alert('Please select a portfolio to update.');
                return;
            }
        }

        if (this.portfolioManager.portfolio.length === 0) {
            alert('Please add some stocks to your portfolio before saving.');
            return;
        }

        try {
            // Get current portfolio data
            const portfolioData = {
                name: profileName,
                savedAt: new Date().toISOString(),
                updatedAt: isUpdate ? new Date().toISOString() : undefined,
                
                // Portfolio Allocator data
                stocks: this.portfolioManager.portfolio.map(stock => ({
                    ticker: stock.ticker,
                    shares: stock.shares
                    // Note: We don't save price as it will be refreshed on load
                })),
                
                // Forecaster & Planner data
                monthlyInvestment: parseFloat(document.getElementById('monthly-investment').value) || 0,
                
                // Current allocations
                currentAllocations: {},
                
                // Timeline changes
                timelineChanges: this.getTimelineChanges(),
                
                // Advanced options
                includeDividends: document.getElementById('include-dividends').checked,
                use10YearAvg: document.getElementById('use-10yr-avg').checked
            };

            // Get current allocations
            this.portfolioManager.portfolio.forEach(stock => {
                const allocationInput = document.getElementById(`allocation-${stock.ticker}`);
                if (allocationInput) {
                    portfolioData.currentAllocations[stock.ticker] = parseFloat(allocationInput.value) || 0;
                }
            });

            // Get existing profiles
            const savedProfiles = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            
            if (isUpdate) {
                // Update existing portfolio
                if (savedProfiles[profileName]) {
                    portfolioData.createdAt = savedProfiles[profileName].savedAt; // Preserve original creation time
                    savedProfiles[profileName] = portfolioData;
                    
                    alert(`Portfolio "${profileName}" updated successfully!`);
                } else {
                    alert('Selected portfolio no longer exists.');
                    return;
                }
            } else {
                // Save as new portfolio
                if (savedProfiles[profileName]) {
                    const overwrite = confirm(`Portfolio "${profileName}" already exists. Do you want to overwrite it?`);
                    if (!overwrite) return;
                }
                
                savedProfiles[profileName] = portfolioData;
                alert(`Portfolio "${profileName}" saved successfully!`);
            }
            
            // Save to localStorage
            localStorage.setItem('portfolioProfiles', JSON.stringify(savedProfiles));
            this.hideSaveModal();
            
        } catch (error) {
            console.error('Error saving portfolio:', error);
            alert('Error saving portfolio. Please try again.');
        }
    }

    getTimelineChanges() {
        const timelineChanges = [];
        const timelineContainer = document.getElementById('timeline-changes');
        
        if (timelineContainer) {
            const changes = timelineContainer.querySelectorAll('.timeline-change');
            changes.forEach(change => {
                const year = change.querySelector('.timeline-year')?.value;
                const amount = change.querySelector('.timeline-amount')?.value;
                
                if (year && amount) {
                    timelineChanges.push({
                        year: parseInt(year),
                        monthlyAmount: parseFloat(amount)
                    });
                }
            });
        }
        
        return timelineChanges;
    }

    showLoadModal() {
        document.getElementById('load-modal').classList.remove('hidden');
        this.refreshPortfolioList();
    }

    hideLoadModal() {
        document.getElementById('load-modal').classList.add('hidden');
    }

    refreshPortfolioList() {
        try {
            const savedProfiles = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            const portfolioList = document.getElementById('portfolio-list');
            const noPortfolios = document.getElementById('no-portfolios');
            const profileNames = Object.keys(savedProfiles);
            
            if (profileNames.length === 0) {
                portfolioList.innerHTML = '';
                noPortfolios.classList.remove('hidden');
                return;
            }
            
            noPortfolios.classList.add('hidden');
            
            // Convert to array and sort by timestamp (newest first)
            const profilesArray = profileNames.map(name => ({
                name,
                ...savedProfiles[name]
            })).sort((a, b) => new Date(b.savedAt || b.timestamp) - new Date(a.savedAt || a.timestamp));
            
            portfolioList.innerHTML = profilesArray.map((profile, index) => {
                const date = new Date(profile.savedAt || profile.timestamp);
                const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
                const stocksList = profile.stocks.map(s => `${s.ticker} (${s.shares})`).join(', ');
                
                return `
                    <div class="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors" 
                         onclick="portfolioSaveLoad.loadPortfolioProfile('${profile.name}')">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-medium text-gray-800">${profile.name}</h4>
                            <button onclick="event.stopPropagation(); portfolioSaveLoad.deletePortfolioProfile('${profile.name}')" 
                                    class="text-red-500 hover:text-red-700 text-sm">
                                🗑️ Delete
                            </button>
                        </div>
                        <div class="text-sm text-gray-600 mb-1">
                            📅 Saved: ${formattedDate}
                        </div>
                        <div class="text-sm text-gray-600 mb-1">
                            📊 Stocks: ${stocksList}
                        </div>
                        <div class="text-sm text-gray-600">
                            💰 Monthly Investment: $${profile.monthlyInvestment.toLocaleString()}
                        </div>
                        ${profile.timelineChanges && profile.timelineChanges.length > 0 ? 
                            `<div class="text-sm text-gray-600">⏰ Timeline Changes: ${profile.timelineChanges.length}</div>` : ''}
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading portfolio list:', error);
            document.getElementById('portfolio-list').innerHTML = '<div class="text-red-500">Error loading portfolios</div>';
        }
    }

    async loadPortfolioProfile(profileName) {
        try {
            const savedProfiles = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            const profile = savedProfiles[profileName];
            
            if (!profile) {
                alert('Portfolio not found.');
                return;
            }

            console.log(`📁 Loading portfolio profile: ${profileName}`);
            
            // Clear current portfolio
            this.portfolioManager.portfolio = [];
            
            // Load stocks and refresh prices
            for (const stockData of profile.stocks) {
                console.log(`🔄 Loading ${stockData.ticker} with ${stockData.shares} shares...`);
                
                try {
                    const price = await this.portfolioManager.getStockPrice(stockData.ticker);
                    this.portfolioManager.portfolio.push({
                        ticker: stockData.ticker,
                        shares: stockData.shares,
                        price: price,
                        totalValue: stockData.shares * price,
                        isRealTime: true
                    });
                } catch (error) {
                    console.error(`Error loading price for ${stockData.ticker}:`, error);
                    // Use a fallback price if API fails
                    const fallbackPrice = this.portfolioManager.getMockStockPrice(stockData.ticker);
                    this.portfolioManager.portfolio.push({
                        ticker: stockData.ticker,
                        shares: stockData.shares,
                        price: fallbackPrice,
                        totalValue: stockData.shares * fallbackPrice,
                        isRealTime: false
                    });
                }
            }
            
            // Update Portfolio Allocator display
            this.portfolioManager.updatePortfolioDisplay();
            this.portfolioManager.updateTargetAllocationInputs();
            
            // Load Forecaster & Planner data
            document.getElementById('monthly-investment').value = profile.monthlyInvestment || 0;
            
            // Load advanced options
            if (profile.includeDividends !== undefined) {
                document.getElementById('include-dividends').checked = profile.includeDividends;
            }
            if (profile.use10YearAvg !== undefined) {
                document.getElementById('use-10yr-avg').checked = profile.use10YearAvg;
            }
            
            // Load current allocations
            if (profile.currentAllocations) {
                Object.keys(profile.currentAllocations).forEach(ticker => {
                    const allocationInput = document.getElementById(`allocation-${ticker}`);
                    if (allocationInput) {
                        allocationInput.value = profile.currentAllocations[ticker];
                    }
                });
            }
            
            // Load timeline changes
            this.loadTimelineChanges(profile.timelineChanges || []);
            
            this.hideLoadModal();
            alert(`Portfolio "${profileName}" loaded successfully! Prices have been refreshed.`);
            
        } catch (error) {
            console.error('Error loading portfolio:', error);
            alert('Error loading portfolio. Please try again.');
        }
    }

    loadTimelineChanges(timelineChanges) {
        // Clear existing timeline changes
        const container = document.getElementById('timeline-changes');
        if (container) {
            container.innerHTML = '';
            
            // Add saved timeline changes
            timelineChanges.forEach(change => {
                const newChange = document.createElement('div');
                newChange.className = 'p-4 bg-gray-50 rounded-lg timeline-change';
                newChange.innerHTML = `
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="number" placeholder="Year" value="${change.year}" class="timeline-year border border-gray-300 rounded-md px-3 py-2">
                        <input type="number" placeholder="New Monthly Amount" value="${change.monthlyAmount}" class="timeline-amount border border-gray-300 rounded-md px-3 py-2">
                    </div>
                    <button class="mt-2 text-sm text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">
                        Remove
                    </button>
                `;
                container.appendChild(newChange);
            });
        }
    }

    deletePortfolioProfile(profileName) {
        try {
            const savedProfiles = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            
            if (!savedProfiles[profileName]) {
                alert('Portfolio not found.');
                return;
            }
            
            if (confirm(`Are you sure you want to delete the portfolio "${profileName}"?`)) {
                delete savedProfiles[profileName];
                localStorage.setItem('portfolioProfiles', JSON.stringify(savedProfiles));
                this.refreshPortfolioList();
                alert(`Portfolio "${profileName}" deleted successfully.`);
            }
            
        } catch (error) {
            console.error('Error deleting portfolio:', error);
            alert('Error deleting portfolio. Please try again.');
        }
    }
}

// Initialize the save/load functionality when the page loads
let portfolioSaveLoad;
document.addEventListener('DOMContentLoaded', () => {
    if (typeof portfolioManager !== 'undefined') {
        portfolioSaveLoad = new PortfolioSaveLoad(portfolioManager);
    }
});
