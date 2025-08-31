# Dockerfile para o Backend Python (Flask)
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências e o código da aplicação
COPY server/requirements.txt .
COPY server/ .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Comando para iniciar a aplicação com Gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:$PORT", "app:app"]

