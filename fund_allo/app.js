// Portfolio Manager Application
class PortfolioManager {
    constructor() {
        this.portfolio = [];
        // Multiple API keys for redundancy and real-time data
        this.apiKeys = {
            finnhub: 'd28dk09r01qjsuf2rgggd28dk09r01qjsuf2rgh0', // Real-time Finnhub API key
            alphaVantage: 'OGXTIWKFM1TFGVKB',
            iex: 'demo', // Get free key at https://iexcloud.io/
            polygon: 'demo' // Get free key at https://polygon.io/
        };
        this.initializeApp();
    }

    initializeApp() {
        this.setupTabNavigation();
        this.setupEventListeners();
        this.loadSavedApiKeys();
        this.updatePortfolioDisplay();
    }

    setupTabNavigation() {
        const allocatorTab = document.getElementById('allocator-tab');
        const forecasterTab = document.getElementById('forecaster-tab');
        const allocatorContent = document.getElementById('allocator-content');
        const forecasterContent = document.getElementById('forecaster-content');

        allocatorTab.addEventListener('click', () => {
            allocatorTab.classList.add('active');
            forecasterTab.classList.remove('active');
            allocatorContent.classList.add('active');
            forecasterContent.classList.remove('active');
        });

        forecasterTab.addEventListener('click', () => {
            forecasterTab.classList.add('active');
            allocatorTab.classList.remove('active');
            forecasterContent.classList.add('active');
            allocatorContent.classList.remove('active');
            this.updateForecasterInputs();
        });
    }

    setupEventListeners() {
        document.getElementById('add-stock-btn').addEventListener('click', () => this.addStock());
        document.getElementById('calculate-rebalance-btn').addEventListener('click', () => this.calculateRebalancing());
        document.getElementById('generate-forecast-btn').addEventListener('click', () => this.generateAdvancedForecast());
        document.getElementById('update-keys-btn').addEventListener('click', () => this.updateApiKeys());
        document.getElementById('refresh-portfolio-btn').addEventListener('click', () => this.refreshPortfolioForForecasting());
        document.getElementById('add-timeline-change-btn').addEventListener('click', () => this.addTimelineChange());
        
        // Save/Load Portfolio functionality
        document.getElementById('save-portfolio-btn').addEventListener('click', () => this.showSaveModal());
        document.getElementById('cancel-save-btn').addEventListener('click', () => this.hideSaveModal());
        document.getElementById('confirm-save-btn').addEventListener('click', () => this.savePortfolioProfile());
        
        // Load modal event listeners
        document.getElementById('load-portfolio-btn').addEventListener('click', () => this.showLoadModal());
        document.getElementById('cancel-load-btn').addEventListener('click', () => this.hideLoadModal());
        
        // Enter key support for ticker input
        document.getElementById('ticker-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addStock();
        });
        
        document.getElementById('shares-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addStock();
        });
        
        // Enter key support for portfolio name
        document.getElementById('portfolio-name-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.savePortfolioProfile();
        });
        
        // Save option radio button listeners
        document.getElementById('save-as-new').addEventListener('change', () => this.handleSaveOptionChange());
        document.getElementById('save-as-update').addEventListener('change', () => this.handleSaveOptionChange());
    }

    updateApiKeys() {
        const finnhubKey = document.getElementById('finnhub-key').value.trim();
        const iexKey = document.getElementById('iex-key').value.trim();
        
        if (finnhubKey) {
            this.apiKeys.finnhub = finnhubKey;
            console.log('✅ Updated Finnhub API key');
        }
        
        if (iexKey) {
            this.apiKeys.iex = iexKey;
            console.log('✅ Updated IEX Cloud API key');
        }
        
        // Save to localStorage for persistence
        localStorage.setItem('portfolioApiKeys', JSON.stringify(this.apiKeys));
        
        alert('API keys updated successfully! New stock prices will use your custom keys.');
    }

    loadSavedApiKeys() {
        try {
            const saved = localStorage.getItem('portfolioApiKeys');
            if (saved) {
                const savedKeys = JSON.parse(saved);
                this.apiKeys = { ...this.apiKeys, ...savedKeys };
                console.log('📁 Loaded saved API keys');
                
                // Populate the input fields
                if (savedKeys.finnhub && savedKeys.finnhub !== 'demo') {
                    document.getElementById('finnhub-key').value = savedKeys.finnhub;
                }
                if (savedKeys.iex && savedKeys.iex !== 'demo') {
                    document.getElementById('iex-key').value = savedKeys.iex;
                }
            }
        } catch (error) {
            console.warn('Could not load saved API keys:', error);
        }
    }

    async getStockPriceWithSource(ticker) {
        const price = await this.getStockPrice(ticker);
        // Check if this is likely mock data by comparing with known mock values
        const mockPrices = {
            'AAPL': 175.50, 'GOOGL': 135.25, 'MSFT': 378.85, 'TSLA': 248.42,
            'AMZN': 145.86, 'NVDA': 875.30, 'META': 325.18, 'NFLX': 445.92,
            'VOO': 571.45, 'VTI': 285.30, 'QQQ': 375.80, 'SPY': 445.20,
            'IVV': 445.15, 'BND': 72.85, 'VEA': 45.20, 'VWO': 38.75
        };
        const isRealTime = !mockPrices[ticker.toUpperCase()] || mockPrices[ticker.toUpperCase()] !== price;
        return { price, isRealTime };
    }

    async getStockPrice(ticker) {
        console.log(`🔍 Fetching real-time price for ${ticker}...`);
        
        // Try multiple APIs in order of preference for real-time data
        const apis = [
            { name: 'Finnhub', func: () => this.getFinnhubPrice(ticker) },
            { name: 'IEX Cloud', func: () => this.getIEXPrice(ticker) },
            { name: 'Alpha Vantage', func: () => this.getAlphaVantagePrice(ticker) }
        ];
        
        for (const api of apis) {
            try {
                console.log(`📡 Trying ${api.name}...`);
                const price = await api.func();
                if (price && price > 0) {
                    console.log(`✅ ${api.name} returned price for ${ticker}: $${price}`);
                    return price;
                }
            } catch (error) {
                console.warn(`⚠️ ${api.name} failed:`, error.message);
                continue;
            }
        }
        
        console.log('🔄 All APIs failed, using mock data');
        return this.getMockStockPrice(ticker);
    }
    
    async getFinnhubPrice(ticker) {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${this.apiKeys.finnhub}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.c && data.c > 0) {
            return parseFloat(data.c); // Current price
        }
        throw new Error('Invalid Finnhub response');
    }
    
    async getIEXPrice(ticker) {
        const url = `https://cloud.iexapis.com/stable/stock/${ticker}/quote?token=${this.apiKeys.iex}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.latestPrice && data.latestPrice > 0) {
            return parseFloat(data.latestPrice);
        }
        throw new Error('Invalid IEX response');
    }
    
    async getAlphaVantagePrice(ticker) {
        const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${this.apiKeys.alphaVantage}`;
        const response = await fetch(url);
        const data = await response.json();
        
        if (data['Global Quote'] && data['Global Quote']['05. price']) {
            return parseFloat(data['Global Quote']['05. price']);
        } else if (data['Note']) {
            throw new Error('Alpha Vantage rate limit reached');
        }
        throw new Error('Invalid Alpha Vantage response');
    }

    getMockStockPrice(ticker) {
        // Mock prices for demonstration (fallback when API fails)
        console.log(`🔄 Using mock price for ${ticker}`);
        const mockPrices = {
            'AAPL': 175.50,
            'GOOGL': 135.25,
            'MSFT': 378.85,
            'TSLA': 248.42,
            'AMZN': 145.86,
            'NVDA': 875.30,
            'META': 325.18,
            'NFLX': 445.92,
            'VOO': 571.45,    // Vanguard S&P 500 ETF
            'VTI': 285.30,    // Vanguard Total Stock Market ETF
            'QQQ': 375.80,    // Invesco QQQ Trust
            'SPY': 445.20,    // SPDR S&P 500 ETF
            'IVV': 445.15,    // iShares Core S&P 500 ETF
            'BND': 72.85,     // Vanguard Total Bond Market ETF
            'VEA': 45.20,     // Vanguard FTSE Developed Markets ETF
            'VWO': 38.75      // Vanguard FTSE Emerging Markets ETF
        };
        const price = mockPrices[ticker.toUpperCase()] || (100 + Math.random() * 200);
        console.log(`📊 Mock price for ${ticker}: $${price}`);
        return price;
    }

    async addStock() {
        const ticker = document.getElementById('ticker-input').value.toUpperCase().trim();
        const shares = parseInt(document.getElementById('shares-input').value);

        if (!ticker || !shares || shares <= 0) {
            alert('Please enter a valid ticker symbol and number of shares.');
            return;
        }

        // Show loading state
        document.getElementById('stock-price').textContent = 'Fetching price...';
        
        try {
            const priceResult = await this.getStockPriceWithSource(ticker);
            const { price, isRealTime } = priceResult;
            
            // Check if stock already exists
            const existingStock = this.portfolio.find(stock => stock.ticker === ticker);
            if (existingStock) {
                existingStock.shares += shares;
                existingStock.totalValue = existingStock.shares * existingStock.price;
            } else {
                this.portfolio.push({
                    ticker,
                    shares,
                    price,
                    totalValue: shares * price,
                    isRealTime
                });
            }

            const indicator = isRealTime ? '🟢 LIVE' : '🔴 MOCK';
            document.getElementById('stock-price').textContent = `${ticker}: $${price.toFixed(2)} (${indicator})`;
            document.getElementById('ticker-input').value = '';
            document.getElementById('shares-input').value = '';
            
            this.updatePortfolioDisplay();
            this.updateTargetAllocationInputs();
        } catch (error) {
            document.getElementById('stock-price').textContent = 'Error fetching price';
            console.error('Error adding stock:', error);
        }
    }

    updatePortfolioDisplay() {
        const holdingsList = document.getElementById('holdings-list');
        const totalValue = this.portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);

        // Update holdings list
        holdingsList.innerHTML = this.portfolio.map(stock => {
            const percentage = totalValue > 0 ? (stock.totalValue / totalValue * 100).toFixed(1) : 0;
            return `
                <div class="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                    <div>
                        <span class="font-medium">${stock.ticker}</span>
                        <span class="text-gray-600 ml-2">${stock.shares} shares @ $${stock.price.toFixed(2)}</span>
                    </div>
                    <div class="text-right">
                        <div class="font-medium">$${stock.totalValue.toFixed(2)}</div>
                        <div class="text-sm text-gray-600">${percentage}%</div>
                    </div>
                    <button onclick="portfolioManager.removeStock('${stock.ticker}')" 
                            class="ml-2 text-red-500 hover:text-red-700">×</button>
                </div>
            `;
        }).join('');

        // Update total value
        document.getElementById('total-value').textContent = `$${totalValue.toFixed(2)}`;

        // Update allocation breakdown
        const allocationBreakdown = document.getElementById('allocation-breakdown');
        if (this.portfolio.length > 0) {
            const breakdown = this.portfolio.map(stock => {
                const percentage = (stock.totalValue / totalValue * 100).toFixed(1);
                return `${stock.ticker}: ${percentage}%`;
            }).join(' | ');
            allocationBreakdown.textContent = breakdown;
        } else {
            allocationBreakdown.textContent = 'No holdings yet';
        }
    }

    removeStock(ticker) {
        this.portfolio = this.portfolio.filter(stock => stock.ticker !== ticker);
        this.updatePortfolioDisplay();
        this.updateTargetAllocationInputs();
    }

    updateTargetAllocationInputs() {
        const container = document.getElementById('target-allocation-inputs');
        container.innerHTML = this.portfolio.map(stock => `
            <div class="flex items-center space-x-2">
                <label class="w-16 text-sm font-medium">${stock.ticker}:</label>
                <input type="number" 
                       id="target-${stock.ticker}" 
                       placeholder="%" 
                       min="0" 
                       max="100"
                       class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-600">%</span>
            </div>
        `).join('');
    }

    calculateRebalancing() {
        const cashAvailable = parseFloat(document.getElementById('cash-available').value) || 0;
        
        if (cashAvailable <= 0) {
            alert('Please enter a valid cash amount.');
            return;
        }

        // Get target allocations
        const targetAllocations = {};
        let totalTargetPercentage = 0;

        for (const stock of this.portfolio) {
            const targetInput = document.getElementById(`target-${stock.ticker}`);
            const targetPercentage = parseFloat(targetInput.value) || 0;
            targetAllocations[stock.ticker] = targetPercentage / 100;
            totalTargetPercentage += targetPercentage;
        }

        if (Math.abs(totalTargetPercentage - 100) > 0.1) {
            alert('Target allocations must sum to 100%');
            return;
        }

        const currentValue = this.portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
        const futureValue = currentValue + cashAvailable;

        // Use optimized algorithm to maximize cash usage
        const recommendations = this.optimizeRebalancing(
            this.portfolio,
            targetAllocations,
            currentValue,
            cashAvailable
        );

        const totalSpent = recommendations.reduce((sum, rec) => sum + rec.cost, 0);
        const remainingCash = cashAvailable - totalSpent;

        this.displayRebalancingResults(recommendations, remainingCash, futureValue - remainingCash);
    }

    optimizeRebalancing(portfolio, targetAllocations, currentValue, cashAvailable) {
        // Calculate max shares we can buy for each stock based on target allocation
        const futureValue = currentValue + cashAvailable;
        const stockLimits = [];
        
        for (const stock of portfolio) {
            const targetValue = futureValue * targetAllocations[stock.ticker];
            const currentStockValue = stock.totalValue;
            const additionalValueNeeded = targetValue - currentStockValue;
            
            if (additionalValueNeeded > 0) {
                const maxShares = Math.floor(additionalValueNeeded / stock.price);
                if (maxShares > 0) {
                    stockLimits.push({
                        ticker: stock.ticker,
                        price: stock.price,
                        maxShares: maxShares,
                        currentValue: currentStockValue
                    });
                }
            }
        }

        if (stockLimits.length === 0) {
            return [];
        }

        // Use greedy approach with local search to maximize cash usage
        let bestSolution = this.greedyRebalance(stockLimits, cashAvailable);
        let bestSpent = bestSolution.reduce((sum, rec) => sum + rec.cost, 0);

        // Try local improvements: for each stock, try adding one more share if under limit
        let improved = true;
        while (improved) {
            improved = false;
            
            for (let i = 0; i < stockLimits.length; i++) {
                const stock = stockLimits[i];
                const currentRec = bestSolution.find(r => r.ticker === stock.ticker);
                const currentShares = currentRec ? currentRec.shares : 0;
                
                if (currentShares < stock.maxShares) {
                    const additionalCost = stock.price;
                    const newSpent = bestSpent + additionalCost;
                    
                    if (newSpent <= cashAvailable) {
                        // Try adding one more share
                        const newSolution = bestSolution.map(rec => 
                            rec.ticker === stock.ticker 
                                ? { ...rec, shares: rec.shares + 1, cost: rec.cost + stock.price }
                                : rec
                        );
                        
                        if (!currentRec) {
                            newSolution.push({
                                ticker: stock.ticker,
                                shares: 1,
                                cost: stock.price,
                                newTotal: stock.currentValue + stock.price
                            });
                        }
                        
                        bestSolution = newSolution;
                        bestSpent = newSpent;
                        improved = true;
                    }
                }
            }
        }

        return bestSolution;
    }

    greedyRebalance(stockLimits, cashAvailable) {
        const recommendations = [];
        let remainingCash = cashAvailable;

        // Sort by price (buy cheaper stocks first to maximize shares)
        const sortedStocks = [...stockLimits].sort((a, b) => a.price - b.price);

        for (const stock of sortedStocks) {
            const maxAffordable = Math.floor(remainingCash / stock.price);
            const sharesToBuy = Math.min(maxAffordable, stock.maxShares);
            
            if (sharesToBuy > 0) {
                const cost = sharesToBuy * stock.price;
                recommendations.push({
                    ticker: stock.ticker,
                    shares: sharesToBuy,
                    cost: cost,
                    newTotal: stock.currentValue + cost
                });
                remainingCash -= cost;
            }
        }

        return recommendations;
    }

    displayRebalancingResults(recommendations, remainingCash, investedAmount) {
        const resultsContainer = document.getElementById('rebalancing-results');
        const recommendationsContainer = document.getElementById('purchase-recommendations');
        const forecastedContainer = document.getElementById('forecasted-allocation');

        // Show purchase recommendations
        recommendationsContainer.innerHTML = recommendations.map(rec => `
            <div class="flex justify-between items-center p-2 bg-white rounded border">
                <span>Buy ${rec.shares} shares of ${rec.ticker}</span>
                <span class="font-medium">$${rec.cost.toFixed(2)}</span>
            </div>
        `).join('');

        if (remainingCash > 0) {
            recommendationsContainer.innerHTML += `
                <div class="p-2 bg-yellow-50 rounded border border-yellow-200">
                    <span class="text-yellow-800">Remaining cash: $${remainingCash.toFixed(2)}</span>
                </div>
            `;
        }

        // Show forecasted allocation
        const newPortfolio = this.portfolio.map(stock => {
            const rec = recommendations.find(r => r.ticker === stock.ticker);
            const newShares = stock.shares + (rec ? rec.shares : 0);
            const newValue = newShares * stock.price;
            return { ...stock, shares: newShares, totalValue: newValue };
        });

        const totalNewValue = newPortfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
        
        forecastedContainer.innerHTML = `
            <h4 class="font-medium mb-2">Forecasted Allocation</h4>
            <div class="space-y-1">
                ${newPortfolio.map(stock => {
                    const percentage = (stock.totalValue / totalNewValue * 100).toFixed(1);
                    return `<div class="flex justify-between text-sm">
                        <span>${stock.ticker}</span>
                        <span>$${stock.totalValue.toFixed(2)} (${percentage}%)</span>
                    </div>`;
                }).join('')}
                <div class="border-t pt-2 mt-2 font-medium">
                    <div class="flex justify-between">
                        <span>Total Portfolio Value</span>
                        <span>$${totalNewValue.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        `;

        resultsContainer.classList.remove('hidden');
    }

    updateForecasterInputs() {
        this.refreshPortfolioForForecasting();
        this.updateCurrentAllocationInputs();
    }

    refreshPortfolioForForecasting() {
        const totalValue = this.portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
        
        // Update initial portfolio display
        document.getElementById('initial-portfolio-value').textContent = `$${totalValue.toLocaleString(undefined, {maximumFractionDigits: 2})}`;
        
        if (this.portfolio.length > 0) {
            const breakdown = this.portfolio.map(stock => {
                const percentage = (stock.totalValue / totalValue * 100).toFixed(1);
                return `${stock.ticker}: $${stock.totalValue.toLocaleString()} (${percentage}%)`;
            }).join(' | ');
            document.getElementById('initial-portfolio-breakdown').textContent = breakdown;
        } else {
            document.getElementById('initial-portfolio-breakdown').textContent = 'No holdings yet - add stocks in the Portfolio Allocator tab';
        }
        
        // Update current allocation inputs
        this.updateCurrentAllocationInputs();
    }

    updateCurrentAllocationInputs() {
        const container = document.getElementById('current-allocation-inputs');
        const totalValue = this.portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
        
        if (this.portfolio.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-sm">Add stocks in the Portfolio Allocator tab first</p>';
            return;
        }
        
        container.innerHTML = this.portfolio.map(stock => {
            const currentPercentage = totalValue > 0 ? (stock.totalValue / totalValue * 100).toFixed(1) : 0;
            return `
                <div class="flex items-center space-x-2">
                    <label class="w-16 text-sm font-medium">${stock.ticker}:</label>
                    <input type="number" 
                           id="allocation-${stock.ticker}" 
                           value="${currentPercentage}"
                           placeholder="%" 
                           min="0" 
                           max="100"
                           class="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                    <span class="text-sm text-gray-600">%</span>
                </div>
            `;
        }).join('');
    }

    addTimelineChange() {
        const container = document.getElementById('timeline-changes');
        const changeId = Date.now();
        
        const changeDiv = document.createElement('div');
        changeDiv.className = 'p-4 bg-gray-50 rounded-lg timeline-change';
        changeDiv.dataset.changeId = changeId;
        
        const allocationInputs = this.portfolio.map(stock => `
            <div class="flex items-center space-x-2">
                <label class="w-16 text-sm font-medium">${stock.ticker}:</label>
                <input type="number" 
                       name="allocation-${stock.ticker}-${changeId}"
                       placeholder="%" 
                       min="0" 
                       max="100"
                       class="flex-1 border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500">
                <span class="text-sm text-gray-600">%</span>
            </div>
        `).join('');
        
        changeDiv.innerHTML = `
            <div class="flex justify-between items-start mb-3">
                <h4 class="font-medium text-gray-800">Timeline Change</h4>
                <button onclick="this.parentElement.parentElement.remove()" class="text-red-500 hover:text-red-700 text-sm">Remove</button>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Year</label>
                    <input type="number" name="year-${changeId}" placeholder="e.g., 2028" min="2025" max="2050" 
                           class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700 mb-1">Monthly Investment</label>
                    <input type="number" name="monthly-${changeId}" placeholder="New monthly amount" 
                           class="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">New Allocation</label>
                <div class="space-y-2">
                    ${allocationInputs}
                </div>
            </div>
        `;
        
        // Insert before the add button
        const addButton = document.getElementById('add-timeline-change-btn');
        container.insertBefore(changeDiv, addButton);
    }

    async getHistoricalReturns(ticker) {
        // 10-year average returns (2014-2024) for major stocks and ETFs
        const tenYearReturns = {
            'AAPL': 0.155,   // 15.5% annual return
            'GOOGL': 0.125,  // 12.5% annual return
            'MSFT': 0.148,   // 14.8% annual return
            'TSLA': 0.285,   // 28.5% annual return (high volatility)
            'AMZN': 0.138,   // 13.8% annual return
            'NVDA': 0.245,   // 24.5% annual return
            'META': 0.118,   // 11.8% annual return
            'NFLX': 0.095,   // 9.5% annual return
            'VOO': 0.108,    // 10.8% annual return (S&P 500)
            'VTI': 0.109,    // 10.9% annual return (Total Market)
            'QQQ': 0.135,    // 13.5% annual return (NASDAQ)
            'QQQM': 0.135,   // 13.5% annual return (NASDAQ)
            'SPY': 0.108,    // 10.8% annual return (S&P 500)
            'SCHD': 0.112,   // 11.2% annual return (Dividend ETF)
            'VEA': 0.058,    // 5.8% annual return (International)
            'VWO': 0.045,    // 4.5% annual return (Emerging Markets)
            'BND': 0.028     // 2.8% annual return (Bonds)
        };
        
        return tenYearReturns[ticker] || 0.10; // Default 10% return
    }

    async getDividendYield(ticker) {
        // Annual dividend yields for major stocks and ETFs
        const dividendYields = {
            'AAPL': 0.005,   // 0.5% dividend yield
            'GOOGL': 0.000,  // 0% dividend yield
            'MSFT': 0.007,   // 0.7% dividend yield
            'TSLA': 0.000,   // 0% dividend yield
            'AMZN': 0.000,   // 0% dividend yield
            'NVDA': 0.003,   // 0.3% dividend yield
            'META': 0.005,   // 0.5% dividend yield
            'NFLX': 0.000,   // 0% dividend yield
            'VOO': 0.015,    // 1.5% dividend yield
            'VTI': 0.014,    // 1.4% dividend yield
            'QQQ': 0.007,    // 0.7% dividend yield
            'QQQM': 0.007,   // 0.7% dividend yield
            'SPY': 0.015,    // 1.5% dividend yield
            'SCHD': 0.035,   // 3.5% dividend yield (Dividend ETF)
            'VEA': 0.025,    // 2.5% dividend yield
            'VWO': 0.028,    // 2.8% dividend yield
            'BND': 0.042     // 4.2% dividend yield (Bonds)
        };
        
        return dividendYields[ticker] || 0.015; // Default 1.5% yield
    }

    async generateAdvancedForecast() {
        const monthlyInvestment = parseFloat(document.getElementById('monthly-investment').value) || 0;
        
        if (monthlyInvestment <= 0) {
            alert('Please enter a valid monthly investment amount.');
            return;
        }

        if (this.portfolio.length === 0) {
            alert('Please add stocks to your portfolio first in the Portfolio Allocator tab.');
            return;
        }

        // Get current allocation
        const currentAllocations = {};
        let totalAllocation = 0;

        for (const stock of this.portfolio) {
            const allocationInput = document.getElementById(`allocation-${stock.ticker}`);
            const allocation = parseFloat(allocationInput.value) || 0;
            currentAllocations[stock.ticker] = allocation / 100;
            totalAllocation += allocation;
        }

        if (Math.abs(totalAllocation - 100) > 0.1) {
            alert('Current allocations must sum to 100%');
            return;
        }

        // Get timeline changes
        const timelineChanges = this.getTimelineChanges();
        
        // Get options
        const includeDividends = document.getElementById('include-dividends').checked;
        const use10YearAvg = document.getElementById('use-10yr-avg').checked;

        // Get historical returns and dividend yields for each stock
        const stockData = {};
        for (const stock of this.portfolio) {
            stockData[stock.ticker] = {
                returns: await this.getHistoricalReturns(stock.ticker),
                dividendYield: await this.getDividendYield(stock.ticker)
            };
        }

        // Generate advanced forecast
        const tableYears = [2, 5, 10, 15, 20, 25, 30]; // For table display (every 5 years)
        const chartYears = Array.from({length: 25}, (_, i) => i + 1); // For chart display (every year: 1, 2, 3, ..., 25)
        const initialValue = this.portfolio.reduce((sum, stock) => sum + stock.totalValue, 0);
        
        console.log('🔮 Generating advanced forecast with:', {
            initialValue,
            monthlyInvestment,
            currentAllocations,
            timelineChanges,
            includeDividends,
            use10YearAvg
        });

        // Generate data for table (every 5 years)
        const tableData = tableYears.map(targetYear => {
            return this.calculateAdvancedProjection(
                targetYear,
                initialValue,
                monthlyInvestment,
                currentAllocations,
                timelineChanges,
                stockData,
                includeDividends
            );
        });

        // Generate data for chart (every year)
        const chartData = chartYears.map(targetYear => {
            return this.calculateAdvancedProjection(
                targetYear,
                initialValue,
                monthlyInvestment,
                currentAllocations,
                timelineChanges,
                stockData,
                includeDividends
            );
        });

        this.displayAdvancedForecastResults(tableData, chartData);
    }

    getTimelineChanges() {
        const changes = [];
        const timelineElements = document.querySelectorAll('.timeline-change');
        
        timelineElements.forEach(element => {
            const changeId = element.dataset.changeId;
            const yearInput = element.querySelector(`input[name="year-${changeId}"]`);
            const monthlyInput = element.querySelector(`input[name="monthly-${changeId}"]`);
            
            const year = parseInt(yearInput.value);
            const monthlyAmount = parseFloat(monthlyInput.value);
            
            if (year && year >= 2025 && monthlyAmount >= 0) {
                const allocations = {};
                let totalAlloc = 0;
                
                this.portfolio.forEach(stock => {
                    const allocInput = element.querySelector(`input[name="allocation-${stock.ticker}-${changeId}"]`);
                    const alloc = parseFloat(allocInput.value) || 0;
                    allocations[stock.ticker] = alloc / 100;
                    totalAlloc += alloc;
                });
                
                // Only include if allocations sum to 100%
                if (Math.abs(totalAlloc - 100) < 0.1) {
                    changes.push({
                        year,
                        monthlyInvestment: monthlyAmount,
                        allocations
                    });
                }
            }
        });
        
        // Sort by year
        return changes.sort((a, b) => a.year - b.year);
    }

    calculateAdvancedProjection(targetYear, initialValue, baseMonthlyInvestment, baseAllocations, timelineChanges, stockData, includeDividends) {
        const currentYear = 2025;
        let portfolioValue = initialValue;
        let totalInvested = initialValue;
        let currentAllocations = { ...baseAllocations };
        let currentMonthlyInvestment = baseMonthlyInvestment;
        
        // Calculate year by year
        for (let year = currentYear; year < currentYear + targetYear; year++) {
            // Check for timeline changes
            const change = timelineChanges.find(c => c.year === year);
            if (change) {
                currentMonthlyInvestment = change.monthlyInvestment;
                currentAllocations = { ...change.allocations };
            }
            
            // Add monthly investments throughout the year
            const annualInvestment = currentMonthlyInvestment * 12;
            portfolioValue += annualInvestment;
            totalInvested += annualInvestment;
            
            // Calculate weighted portfolio return for this year
            let portfolioReturn = 0;
            let portfolioDividendYield = 0;
            
            for (const ticker in currentAllocations) {
                const allocation = currentAllocations[ticker];
                portfolioReturn += allocation * stockData[ticker].returns;
                portfolioDividendYield += allocation * stockData[ticker].dividendYield;
            }
            
            // Apply capital appreciation
            portfolioValue *= (1 + portfolioReturn);
            
            // Apply dividend reinvestment if enabled
            if (includeDividends) {
                const dividendAmount = portfolioValue * portfolioDividendYield;
                portfolioValue += dividendAmount;
                // Note: dividends are reinvested, not counted as new investment
            }
        }
        
        const gains = portfolioValue - totalInvested;
        const returnPercentage = totalInvested > 0 ? (gains / totalInvested) * 100 : 0;
        
        return {
            years: targetYear,
            portfolioValue,
            totalInvested,
            gains,
            returnPercentage,
            allocations: currentAllocations
        };
    }

    displayAdvancedForecastResults(tableData, chartData = null) {
    // Use chartData for chart if provided, otherwise use tableData for both
    const dataForChart = chartData || tableData;
    
    // Update table with enhanced information (every 5 years)
    const tableBody = document.getElementById('forecast-table-body');
    tableBody.innerHTML = tableData.map(data => {
        const dividendInfo = document.getElementById('include-dividends').checked ? 
            '<br><span class="text-xs text-blue-600">📈 Includes dividend reinvestment</span>' : '';
        
        return `
            <tr class="border-b">
                <td class="py-3">
                    <div class="font-medium">${data.years} years</div>
                    <div class="text-xs text-gray-500">Target: ${2025 + data.years}</div>
                </td>
                <td class="text-right py-3">
                    <div class="font-medium text-green-600">$${data.portfolioValue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    ${dividendInfo}
                </td>
                <td class="text-right py-3">
                    <div>$${data.totalInvested.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                </td>
                <td class="text-right py-3 ${data.gains >= 0 ? 'text-green-600' : 'text-red-600'}">
                    <div class="font-medium">$${data.gains.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
                    <div class="text-sm">(${data.returnPercentage.toFixed(1)}%)</div>
                </td>
            </tr>
        `;
    }).join('');

    // Update chart with yearly data points
    this.updateAdvancedForecastChart(dataForChart);
    
    // Show allocation evolution using table data
    this.displayAllocationEvolution(tableData);
}

    displayAllocationEvolution(forecastData) {
        // Add allocation evolution display after the chart
        const chartContainer = document.querySelector('#forecast-chart').parentElement;
        
        // Remove existing allocation display
        const existingDisplay = chartContainer.querySelector('.allocation-evolution');
        if (existingDisplay) {
            existingDisplay.remove();
        }
        
        const allocationDiv = document.createElement('div');
        allocationDiv.className = 'allocation-evolution mt-6 p-4 bg-purple-50 rounded-lg';
        
        const timelineChanges = this.getTimelineChanges();
        let allocationHTML = '<h4 class="font-medium mb-3 text-purple-800">📊 Allocation Evolution</h4>';
        
        if (timelineChanges.length > 0) {
            allocationHTML += '<div class="space-y-2 text-sm">';
            
            // Show current allocation
            const currentAllocations = {};
            this.portfolio.forEach(stock => {
                const input = document.getElementById(`allocation-${stock.ticker}`);
                currentAllocations[stock.ticker] = parseFloat(input.value) || 0;
            });
            
            allocationHTML += '<div class="p-2 bg-white rounded border-l-4 border-purple-400">';
            allocationHTML += '<div class="font-medium text-purple-700">2025 (Current)</div>';
            allocationHTML += '<div class="text-gray-600">';
            for (const ticker in currentAllocations) {
                allocationHTML += `${ticker}: ${currentAllocations[ticker].toFixed(1)}% `;
            }
            allocationHTML += '</div></div>';
            
            // Show timeline changes
            timelineChanges.forEach(change => {
                allocationHTML += '<div class="p-2 bg-white rounded border-l-4 border-blue-400">';
                allocationHTML += `<div class="font-medium text-blue-700">${change.year}</div>`;
                allocationHTML += '<div class="text-gray-600">';
                for (const ticker in change.allocations) {
                    allocationHTML += `${ticker}: ${(change.allocations[ticker] * 100).toFixed(1)}% `;
                }
                allocationHTML += `</div><div class="text-xs text-gray-500">Monthly: $${change.monthlyInvestment.toLocaleString()}</div>`;
                allocationHTML += '</div>';
            });
            
            allocationHTML += '</div>';
        } else {
            allocationHTML += '<p class="text-sm text-gray-600">No allocation changes planned. Current allocation maintained throughout forecast period.</p>';
        }
        
        allocationDiv.innerHTML = allocationHTML;
        chartContainer.appendChild(allocationDiv);
    }

    updateAdvancedForecastChart(forecastData) {
        const ctx = document.getElementById('forecast-chart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (window.forecastChart) {
            window.forecastChart.destroy();
        }

        const includeDividends = document.getElementById('include-dividends').checked;
        const chartTitle = includeDividends ? 
            'Advanced Portfolio Growth Forecast (with Dividend Reinvestment)' : 
            'Advanced Portfolio Growth Forecast';

        window.forecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecastData.map(d => `${d.years} years (${2025 + d.years})`),
                datasets: [
                    {
                        label: 'Portfolio Value',
                        data: forecastData.map(d => d.portfolioValue),
                        borderColor: 'rgb(147, 51, 234)',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                        tension: 0.1,
                        fill: true
                    },
                    {
                        label: 'Total Invested',
                        data: forecastData.map(d => d.totalInvested),
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.1
                    },
                    {
                        label: 'Gains',
                        data: forecastData.map(d => d.gains),
                        borderColor: 'rgb(34, 197, 94)',
                        backgroundColor: 'rgba(34, 197, 94, 0.1)',
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                plugins: {
                    title: {
                        display: true,
                        text: chartTitle,
                        font: {
                            size: 16
                        }
                    },
                    legend: {
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.parsed.y;
                                const label = context.dataset.label;
                                return `${label}: $${value.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                if (value >= 1000000) {
                                    return '$' + (value / 1000000).toFixed(1) + 'M';
                                } else if (value >= 1000) {
                                    return '$' + (value / 1000).toFixed(0) + 'K';
                                }
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Time Horizon'
                        }
                    }
                }
            }
        });
    }

    updateForecastChart(forecastData) {
        // Fallback to advanced chart for compatibility
        this.updateAdvancedForecastChart(forecastData);
    }

    // Portfolio Save/Load Functionality
    showSaveModal() {
        document.getElementById('save-modal').classList.remove('hidden');
        document.getElementById('portfolio-name-input').focus();
        
        // Reset to default state
        document.getElementById('save-as-new').checked = true;
        this.handleSaveOptionChange();
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
            const savedPortfolios = JSON.parse(localStorage.getItem('portfolioProfiles') || '{}');
            
            Object.keys(savedPortfolios).forEach(profileName => {
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

    hideSaveModal() {
        document.getElementById('save-modal').classList.add('hidden');
        document.getElementById('portfolio-name-input').value = '';
    }

    showLoadModal() {
        document.getElementById('load-modal').classList.remove('hidden');
        this.refreshPortfolioList();
    }

    hideLoadModal() {
        document.getElementById('load-modal').classList.add('hidden');
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

        if (this.portfolio.length === 0) {
            alert('Please add some stocks to your portfolio before saving.');
            return;
        }

        // Collect all portfolio data
        const portfolioData = {
            name: profileName,
            timestamp: new Date().toISOString(),
            
            // Portfolio Allocator data
            stocks: this.portfolio.map(stock => ({
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
            use10YearAvg: document.getElementById('use-10yr-avg').checked,
            savedAt: new Date().toISOString(),
            updatedAt: isUpdate ? new Date().toISOString() : undefined
        };

        // Get current allocations
        this.portfolio.forEach(stock => {
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
                         onclick="portfolioManager.loadPortfolioProfile('${profile.name}')">
                        <div class="flex justify-between items-start mb-2">
                            <h4 class="font-medium text-gray-800">${profile.name}</h4>
                            <button onclick="event.stopPropagation(); portfolioManager.deletePortfolioProfile('${profile.name}')" 
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
                        ${profile.timelineChanges.length > 0 ? 
                            `<div class="text-sm text-blue-600">📅 ${profile.timelineChanges.length} timeline change(s)</div>` : 
                            ''
                        }
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            console.error('Error loading portfolio list:', error);
            document.getElementById('portfolio-list').innerHTML = '<div class="text-red-500 p-4">Error loading portfolios</div>';
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
            
            console.log('📁 Loading portfolio profile:', profile);
            
            // Clear current portfolio
            this.portfolio = [];
            
            // Load stocks and refresh prices
            for (const stockData of profile.stocks) {
                console.log(`🔄 Loading ${stockData.ticker} with ${stockData.shares} shares...`);
                
                try {
                    const price = await this.getStockPrice(stockData.ticker);
                    this.portfolio.push({
                        ticker: stockData.ticker,
                        shares: stockData.shares,
                        price: price,
                        totalValue: stockData.shares * price,
                        isRealTime: true
                    });
                } catch (error) {
                    console.error(`Error loading price for ${stockData.ticker}:`, error);
                    // Use a fallback price if API fails
                    const fallbackPrice = this.getMockStockPrice(stockData.ticker);
                    this.portfolio.push({
                        ticker: stockData.ticker,
                        shares: stockData.shares,
                        price: fallbackPrice,
                        totalValue: stockData.shares * fallbackPrice,
                        isRealTime: false
                    });
                }
            }
            
            // Update Portfolio Allocator display
            this.updatePortfolioDisplay();
            this.updateTargetAllocationInputs();
            
            // Load Forecaster & Planner data
            document.getElementById('monthly-investment').value = profile.monthlyInvestment || 0;
            
            // Load advanced options
            document.getElementById('include-dividends').checked = profile.includeDividends !== false;
            document.getElementById('use-10yr-avg').checked = profile.use10YearAvg !== false;
            
            // Update forecaster inputs
            this.updateForecasterInputs();
            
            // Load current allocations
            setTimeout(() => {
                this.portfolio.forEach(stock => {
                    const allocationInput = document.getElementById(`allocation-${stock.ticker}`);
                    if (allocationInput && profile.currentAllocations[stock.ticker] !== undefined) {
                        allocationInput.value = profile.currentAllocations[stock.ticker];
                    }
                });
            }, 100);
            
            // Load timeline changes
            this.loadTimelineChanges(profile.timelineChanges || []);
            
            this.hideLoadModal();
            alert(`Portfolio "${profile.name}" loaded successfully! Prices have been refreshed.`);
            
        } catch (error) {
            console.error('Error loading portfolio:', error);
            alert('Error loading portfolio. Please try again.');
        }
    }

    loadTimelineChanges(timelineChanges) {
        // Clear existing timeline changes
        const existingChanges = document.querySelectorAll('.timeline-change');
        existingChanges.forEach(change => change.remove());
        
        // Add saved timeline changes
        timelineChanges.forEach(change => {
            this.addTimelineChange();
            
            // Find the most recently added timeline change
            const timelineElements = document.querySelectorAll('.timeline-change');
            const lastElement = timelineElements[timelineElements.length - 1];
            const changeId = lastElement.dataset.changeId;
            
            // Populate the fields
            const yearInput = lastElement.querySelector(`input[name="year-${changeId}"]`);
            const monthlyInput = lastElement.querySelector(`input[name="monthly-${changeId}"]`);
            
            if (yearInput) yearInput.value = change.year;
            if (monthlyInput) monthlyInput.value = change.monthlyInvestment;
            
            // Populate allocation inputs
            for (const ticker in change.allocations) {
                const allocInput = lastElement.querySelector(`input[name="allocation-${ticker}-${changeId}"]`);
                if (allocInput) {
                    allocInput.value = (change.allocations[ticker] * 100).toFixed(1);
                }
            }
        });
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

// Timeline changes functionality
function addTimelineChange() {
    const container = document.getElementById('timeline-changes');
    const newChange = document.createElement('div');
    newChange.className = 'p-4 bg-gray-50 rounded-lg';
    newChange.innerHTML = `
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input type="number" placeholder="Year" class="timeline-year border border-gray-300 rounded-md px-3 py-2">
            <input type="number" placeholder="New Monthly Amount" class="timeline-amount border border-gray-300 rounded-md px-3 py-2">
        </div>
        <button class="mt-2 text-sm text-red-500 hover:text-red-700" onclick="this.parentElement.remove()">
            Remove
        </button>
    `;
    container.appendChild(newChange);
}

// Initialize the application
const portfolioManager = new PortfolioManager();
