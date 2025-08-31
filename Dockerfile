FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY server/requirements.txt .
COPY server/ .

RUN pip install --no-cache-dir -r requirements.txt

# Usar um script de entrada para garantir que $PORT seja interpretado corretamente
COPY server/start.sh .
ENTRYPOINT ["./start.sh"]

