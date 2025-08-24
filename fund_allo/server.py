#!/usr/bin/env python3
"""
Portfolio Allocation & Forecasting Web Server
Simple HTTP server to serve the portfolio management webapp
"""

import http.server
import socketserver
import os
import webbrowser
from urllib.parse import urlparse, parse_qs
import json
import requests
from datetime import datetime, timedelta

class PortfolioHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.getcwd(), **kwargs)
    
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()
    
    def do_GET(self):
        parsed_path = urlparse(self.path)
        
        # Handle API endpoints
        if parsed_path.path.startswith('/api/'):
            self.handle_api_request(parsed_path)
        else:
            # Serve static files
            super().do_GET()
    
    def handle_api_request(self, parsed_path):
        try:
            if parsed_path.path == '/api/stock-price':
                self.handle_stock_price(parsed_path)
            elif parsed_path.path == '/api/historical-data':
                self.handle_historical_data(parsed_path)
            else:
                self.send_error(404, "API endpoint not found")
        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")
    
    def handle_stock_price(self, parsed_path):
        """Get current stock price using Alpha Vantage API"""
        query_params = parse_qs(parsed_path.query)
        ticker = query_params.get('symbol', [''])[0].upper()
        
        if not ticker:
            self.send_error(400, "Missing symbol parameter")
            return
        
        # Mock data for demonstration (replace with actual API call)
        mock_prices = {
            'AAPL': 175.50,
            'GOOGL': 135.25,
            'MSFT': 378.85,
            'TSLA': 248.42,
            'AMZN': 145.86,
            'NVDA': 875.30,
            'META': 325.18,
            'NFLX': 445.92,
            'SPY': 445.20,
            'QQQ': 375.80
        }
        
        price = mock_prices.get(ticker, 100 + (hash(ticker) % 200))
        
        response_data = {
            'symbol': ticker,
            'price': round(price, 2),
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())
    
    def handle_historical_data(self, parsed_path):
        """Get historical returns for forecasting"""
        query_params = parse_qs(parsed_path.query)
        ticker = query_params.get('symbol', [''])[0].upper()
        
        if not ticker:
            self.send_error(400, "Missing symbol parameter")
            return
        
        # Mock historical returns (10-year average annual returns)
        mock_returns = {
            'AAPL': 0.15,   # 15% annual return
            'GOOGL': 0.12,  # 12% annual return
            'MSFT': 0.14,   # 14% annual return
            'TSLA': 0.25,   # 25% annual return (high volatility)
            'AMZN': 0.13,   # 13% annual return
            'NVDA': 0.20,   # 20% annual return
            'META': 0.11,   # 11% annual return
            'NFLX': 0.09,   # 9% annual return
            'SPY': 0.10,    # 10% annual return (S&P 500)
            'QQQ': 0.12     # 12% annual return (NASDAQ)
        }
        
        annual_return = mock_returns.get(ticker, 0.10)  # Default 10%
        
        response_data = {
            'symbol': ticker,
            'annual_return': annual_return,
            'period': '10_years',
            'timestamp': datetime.now().isoformat()
        }
        
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())

def start_server(port=8000):
    """Start the portfolio management web server"""
    try:
        with socketserver.TCPServer(("", port), PortfolioHandler) as httpd:
            print(f"Portfolio Manager Server running at http://localhost:{port}")
            print("Press Ctrl+C to stop the server")
            
            # Open browser automatically
            webbrowser.open(f'http://localhost:{port}')
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"Port {port} is already in use. Trying port {port + 1}...")
            start_server(port + 1)
        else:
            raise

if __name__ == "__main__":
    start_server()
