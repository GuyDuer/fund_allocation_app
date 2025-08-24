# Portfolio Allocator & Forecaster

A comprehensive web application for portfolio management, allocation optimization, and long-term forecasting.

## Features

### Portfolio Allocator
- **Stock Management**: Add stocks by ticker symbol with automatic price fetching
- **Portfolio Overview**: View current holdings with allocation percentages
- **Rebalancing Tool**: Enter available cash and target allocations to get purchase recommendations
- **Optimization**: Calculates optimal whole-share purchases to maximize cash utilization

### Forecaster & Planner
- **Long-term Projections**: Forecast portfolio value over 2, 5, 10, 15, 20, and 25 years
- **Monthly Investment Planning**: Factor in regular monthly contributions
- **Dynamic Allocation**: Plan for changing investment ratios over time
- **Visual Charts**: Interactive charts showing portfolio growth projections

## Quick Start

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Start the Server**:
   ```bash
   python server.py
   ```

3. **Open Your Browser**: The application will automatically open at `http://localhost:8000`

## How to Use

### Adding Stocks
1. Navigate to the "Portfolio Allocator" tab
2. Enter a ticker symbol (e.g., AAPL, GOOGL, MSFT)
3. Enter the number of shares you own
4. Click "Add Stock" - the current price will be fetched automatically

### Portfolio Rebalancing
1. Add your current holdings first
2. Enter the amount of cash you have available to invest
3. Set your target allocation percentages for each stock
4. Click "Calculate Rebalancing" to see purchase recommendations

### Forecasting
1. Switch to the "Forecaster & Planner" tab
2. Enter your planned monthly investment amount
3. Set the investment ratio for new purchases
4. Add timeline changes if you plan to modify investments over time
5. Click "Generate Forecast" to see projections

## API Integration

The application uses Alpha Vantage API for real-time stock prices. The API key is configured in the application. If you encounter rate limits, the app will fall back to mock data for demonstration purposes.

## Technical Details

- **Frontend**: HTML5, Tailwind CSS, Vanilla JavaScript, Chart.js
- **Backend**: Python HTTP server with API endpoints
- **Data**: Real-time stock prices via Alpha Vantage API
- **Calculations**: Compound interest formulas for forecasting

## Example Scenarios

### Scenario 1: Current Portfolio Analysis
- Add AAPL (10 shares), GOOGL (5 shares), MSFT (8 shares)
- View total portfolio value and allocation percentages
- Identify over/under-weighted positions

### Scenario 2: Rebalancing with New Cash
- Current portfolio: $10,000 in various stocks
- Available cash: $2,000
- Target: 40% AAPL, 35% GOOGL, 25% MSFT
- Get specific share purchase recommendations

### Scenario 3: 20-Year Retirement Planning
- Monthly investment: $1,000
- Current portfolio: $50,000
- Investment ratio: 60% stocks, 40% bonds
- Timeline change: Reduce to $500/month after 10 years
- See projected portfolio value at retirement

## Notes

- Stock prices are fetched in real-time when possible
- Rebalancing calculations optimize for whole shares only
- Forecasting uses historical 10-year average returns
- All calculations assume reinvestment of dividends
