# Dockerfile para o Backend Python (Flask)
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copiar arquivos de dependências
COPY server/requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código do servidor
COPY server/ .

# Copiar arquivo de configuração


# Expor porta
EXPOSE 5000

# Comando para iniciar o servidor
CMD ["python", "app.py"]

