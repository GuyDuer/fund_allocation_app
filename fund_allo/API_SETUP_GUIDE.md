# 🚀 Real-Time Financial API Setup Guide

Your portfolio app now supports **multiple financial APIs** for the most accurate real-time stock prices! Here's how to get free API keys for better data:

## 🥇 **Recommended: Finnhub (Best Real-Time Data)**

### Why Finnhub?
- ✅ **True real-time** data (< 100ms latency)
- ✅ **60 calls/minute** free tier
- ✅ **Global coverage** (US, EU, Asia stocks)
- ✅ **No CORS issues** (works in browser)

### Setup Steps:
1. **Sign up**: Go to [finnhub.io/register](https://finnhub.io/register)
2. **Verify email**: Check your email and verify account
3. **Get API key**: Copy your free API key from the dashboard
4. **Add to app**: Paste into "Finnhub API Key" field in the portfolio app

**Free Tier**: 60 calls/minute, unlimited symbols

---

## 🥈 **Alternative: IEX Cloud (US Stocks)**

### Why IEX Cloud?
- ✅ **Real-time** US market data
- ✅ **500,000 calls/month** free
- ✅ **High quality** data from IEX Exchange
- ✅ **Easy integration**

### Setup Steps:
1. **Sign up**: Go to [iexcloud.io/](https://iexcloud.io/)
2. **Create account**: Use the free "Start" plan
3. **Get token**: Copy your publishable token
4. **Add to app**: Paste into "IEX Cloud API Key" field

**Free Tier**: 500,000 calls/month, US stocks only

---

## 🥉 **Backup: Alpha Vantage (Already Configured)**

- ✅ **Already set up** with your key
- ⚠️ **25 calls/day** limit (very restrictive)
- ✅ **Global coverage**

---

## 📊 **API Comparison Table**

| API | Real-Time | Free Limit | Coverage | Latency | Best For |
|-----|-----------|------------|----------|---------|----------|
| **Finnhub** | ✅ Yes | 60/min | Global | <100ms | **Best overall** |
| **IEX Cloud** | ✅ Yes | 500K/month | US only | Low | US portfolios |
| **Alpha Vantage** | ⚠️ Delayed | 25/day | Global | High | Backup only |

---

## 🔧 **How the Multi-API System Works**

Your app tries APIs in this order:
1. **Finnhub** (if key provided) → Real-time data
2. **IEX Cloud** (if key provided) → Real-time US data  
3. **Alpha Vantage** (your existing key) → Delayed data
4. **Mock Data** (if all APIs fail) → Demo prices

---

## 🧪 **Testing Your Setup**

1. **Add API keys** in the portfolio app
2. **Add a stock** (try AAPL, VOO, GOOGL)
3. **Check the indicator**:
   - 🟢 **LIVE** = Real-time API data
   - 🔴 **MOCK** = Fallback demo data
4. **Open browser console** (F12) to see which API succeeded

---

## 💡 **Pro Tips**

### For Best Real-Time Data:
- **Get Finnhub key** (60 calls/minute is plenty for portfolio management)
- **Use IEX for US stocks** (if you only trade US markets)
- **Keep Alpha Vantage** as backup

### For High-Volume Usage:
- **Upgrade Finnhub** ($9/month for unlimited calls)
- **Use IEX Cloud Pro** for more calls
- **Consider Polygon.io** for professional trading

### For International Stocks:
- **Finnhub** supports global markets
- **Alpha Vantage** has good international coverage
- **Avoid IEX** (US only)

---

## 🚨 **Troubleshooting**

### Getting Mock Data Instead of Real Data?
1. Check your API keys are entered correctly
2. Verify your free tier limits aren't exceeded
3. Check browser console for error messages
4. Try a different API (Finnhub → IEX → Alpha Vantage)

### API Key Not Working?
1. Double-check the key is copied correctly (no extra spaces)
2. Verify your account is activated (check email)
3. Make sure you're using the correct key type (publishable for IEX)

### Still Seeing Old Prices?
- Real-time data depends on market hours
- Some APIs show last trading day price when markets are closed
- Compare with your broker to verify accuracy

---

## 🎯 **Recommended Setup for Most Users**

1. **Get a free Finnhub account** (5 minutes)
2. **Add the Finnhub key** to your portfolio app
3. **Keep Alpha Vantage** as backup
4. **Enjoy real-time portfolio tracking!**

This gives you 60 real-time price updates per minute, which is perfect for portfolio management and rebalancing calculations.
