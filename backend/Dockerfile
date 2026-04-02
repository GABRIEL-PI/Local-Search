FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    curl \
    chromium \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install bcrypt==4.1.3

# Download google-maps-scraper (rod version - uses go-rod, no Playwright needed)
RUN curl -sL https://github.com/gosom/google-maps-scraper/releases/download/v1.11.0/google_maps_scraper-1.11.0-rod-linux-amd64 \
    -o /usr/local/bin/google-maps-scraper-rod && chmod +x /usr/local/bin/google-maps-scraper-rod

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
