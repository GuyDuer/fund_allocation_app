import http.server
import socketserver
import requests
from datetime import datetime, timedelta
import json
import logging
import asyncio
from aiohttp import web, ClientSession
from functools import lru_cache
import heapq

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
LOCATIONS = [
    ('Dwingelderveld National Park', '52.8143,6.4078'),
    ('Netherlands Open Air Museum', '52.0056,5.9115'),
    ('Gouda', '52.0115,4.7104'),
    ('Texel Island', '53.0553,4.7963'),
    ('Zaanse Schans', '52.4716,4.8229'),
    ('Giethoorn', '52.7401,6.0779'),
    ('Arnhem (Burgers\' Zoo)', '52.0055,5.8398'),
    ('Utrecht', '52.0907,5.1214'),
    ('Madurodam', '52.0994,4.3006'),
    ('Efteling', '51.6504,5.0439')
]
START_DATE = datetime(2024, 10, 15).date()
DATE_RANGE = [START_DATE + timedelta(days=i) for i in range(11)]

# Updated API key
API_KEY = '397a849ec369cab66c043b51f9e1ffe7'

# Caching weather data using lru_cache to avoid repeated API calls
CACHE_EXPIRY = timedelta(hours=1)


@lru_cache(maxsize=128)
async def fetch_weather_data(lat, lon):
    url = f"https://api.openweathermap.org/data/2.5/forecast?lat={lat}&lon={lon}&appid={API_KEY}&units=metric"
    try:
        async with ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()  # Raises an HTTPError for bad responses
                data = await response.json()
                return data
    except Exception as e:
        logging.error(f"Error fetching data: {e}")
        logging.error(f"URL: {url}")
        return None


def process_forecast(data):
    if not data or 'list' not in data:
        logging.error(f"Error: Invalid data format. Data received: {json.dumps(data, indent=2) if data else 'None'}")
        return []

    processed = {date: {'morning': None, 'afternoon': None} for date in DATE_RANGE}
    for item in data['list']:
        dt = datetime.fromtimestamp(item['dt'])
        date = dt.date()
        if date in processed:
            if dt.hour >= 6 and dt.hour < 12 and not processed[date]['morning']:
                processed[date]['morning'] = {
                    'temperature': round(item['main']['temp'], 1),
                    'rain_chance': round(item.get('pop', 0) * 100)
                }
            elif dt.hour >= 12 and dt.hour < 18 and not processed[date]['afternoon']:
                processed[date]['afternoon'] = {
                    'temperature': round(item['main']['temp'], 1),
                    'rain_chance': round(item.get('pop', 0) * 100)
                }

    return [{'date': date, **forecast} for date, forecast in processed.items()]


def get_weather_icon(rain_chance):
    if rain_chance < 30:
        return '☀️'
    elif rain_chance < 60:
        return '☁️'
    else:
        return '🌧️'


def get_best_worst_days(location_forecast):
    scores = []
    for i, day in enumerate(location_forecast):
        if day['morning'] and day['afternoon']:
            score = (day['morning']['temperature'] + day['afternoon']['temperature']) / 2 - \
                    (day['morning']['rain_chance'] + day['afternoon']['rain_chance']) / 2
            scores.append((i, score))
    if scores:
        best_day = heapq.nlargest(1, scores, key=lambda x: x[1])[0][0]
        worst_day = heapq.nsmallest(1, scores, key=lambda x: x[1])[0][0]
        return best_day, worst_day
    return None, None


def generate_html(forecasts):
    html = '''
    <html>
    <head>
        <title>Dutch Weather Forecast Matrix</title>
        <style>
            body { font-family: Arial, sans-serif; }
            table { border-collapse: collapse; }
            th, td { border: 1px solid black; padding: 5px; text-align: center; }
            .best-day { color: green; }
            .worst-day { color: red; }
        </style>
    </head>
    <body>
        <h1>Dutch Weather Forecast Matrix (Oct 15-25, 2024)</h1>
        <table>
            <tr>
                <th>Location</th>
    '''

    for date in DATE_RANGE:
        html += f'<th colspan="2">{date.strftime("%b %d")}</th>'

    html += '</tr><tr><th></th>'
    for _ in DATE_RANGE:
        html += '<th>AM</th><th>PM</th>'
    html += '</tr>'

    for location, _ in LOCATIONS:
        html += f'<tr><td>{location}</td>'
        location_forecast = forecasts[location]
        best_day, worst_day = get_best_worst_days(location_forecast)

        for i, day in enumerate(location_forecast):
            am = day['morning'] or {'temperature': 'N/A', 'rain_chance': 'N/A'}
            pm = day['afternoon'] or {'temperature': 'N/A', 'rain_chance': 'N/A'}
            html += f'''
                <td>
                    {get_weather_icon(am['rain_chance']) if am['rain_chance'] != 'N/A' else ''}
                    {am['temperature']}°C<br>
                    {am['rain_chance']}%
                </td>
                <td>
                    {get_weather_icon(pm['rain_chance']) if pm['rain_chance'] != 'N/A' else ''}
                    {pm['temperature']}°C<br>
                    {pm['rain_chance']}%
                    {' 🌞' if i == best_day else ''}
                    {' ☔' if i == worst_day else ''}
                </td>
            '''
        html += '</tr>'

    html += '''
        </table>
    </body>
    </html>
    '''
    return html


async def handle_request(request):
    forecasts = {}
    for location, coords in LOCATIONS:
        lat, lon = coords.split(',')
        data = await fetch_weather_data(lat, lon)
        if data:
            forecasts[location] = process_forecast(data)
        else:
            forecasts[location] = []
            logging.warning(f"No data available for {location}")

    html_content = generate_html(forecasts)
    return web.Response(text=html_content, content_type='text/html')


async def init_app():
    app = web.Application()
    app.router.add_get('/', handle_request)
    return app


if __name__ == "__main__":
    app = asyncio.run(init_app())
    web.run_app(app, host='localhost', port=8000)

