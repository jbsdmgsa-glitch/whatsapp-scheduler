FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt .
COPY server/ .

RUN pip install --no-cache-dir -r requirements.txt

CMD [ "gunicorn", "--bind", "0.0.0.0:$PORT", "app:app" ]

