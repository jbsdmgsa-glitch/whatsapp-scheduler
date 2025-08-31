#!/bin/bash

# Script de inicialização do Sistema de Agendamento WhatsApp e E-mail
# Autor: Sistema Automatizado
# Data: $(date +%Y-%m-%d)

echo "🚀 Iniciando Sistema de Agendamento WhatsApp e E-mail..."
echo "=================================================="

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    echo "   Visite: https://docs.docker.com/get-docker/"
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    echo "   Visite: https://docs.docker.com/compose/install/"
    exit 1
fi

# Verificar se arquivo .env existe
if [ ! -f ".env" ]; then
    echo "⚠️  Arquivo .env não encontrado. Criando arquivo de exemplo..."
    cp .env.example .env 2>/dev/null || {
        echo "❌ Arquivo .env.example não encontrado. Criando .env básico..."
        cat > .env << EOF
# Configurações SMTP para envio de e-mails
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=seu_email@gmail.com
SMTP_PASSWORD=sua_senha_de_app

# Configurações do WhatsApp
WHATSAPP_API_URL=http://localhost:3000
WHATSAPP_API_KEY=

# Configurações gerais
TIMEZONE=America/Sao_Paulo
EOF
    }
    echo "📝 Por favor, edite o arquivo .env com suas configurações antes de continuar."
    echo "   Especialmente as configurações SMTP para envio de e-mails."
    read -p "Pressione Enter quando terminar de configurar o .env..."
fi

# Verificar se as portas estão disponíveis
echo "🔍 Verificando disponibilidade das portas..."

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo "❌ Porta $1 já está em uso. Por favor, libere a porta ou altere a configuração."
        return 1
    else
        echo "✅ Porta $1 disponível"
        return 0
    fi
}

check_port 3000 || exit 1
check_port 5000 || exit 1
check_port 8080 || exit 1

# Parar containers existentes se houver
echo "🛑 Parando containers existentes..."
docker-compose down 2>/dev/null

# Construir e iniciar os serviços
echo "🏗️  Construindo containers..."
docker-compose build

echo "🚀 Iniciando serviços..."
docker-compose up -d

# Aguardar serviços iniciarem
echo "⏳ Aguardando serviços iniciarem..."
sleep 10

# Verificar status dos serviços
echo "🔍 Verificando status dos serviços..."
docker-compose ps

# Testar conectividade
echo "🧪 Testando conectividade..."

# Testar backend
if curl -s http://localhost:5000/health > /dev/null; then
    echo "✅ Backend (Flask) - OK"
else
    echo "❌ Backend (Flask) - Falha"
fi

# Testar WhatsApp service
if curl -s http://localhost:3000/status > /dev/null; then
    echo "✅ WhatsApp Service - OK"
else
    echo "❌ WhatsApp Service - Falha"
fi

# Testar frontend
if curl -s http://localhost:8080 > /dev/null; then
    echo "✅ Frontend (Nginx) - OK"
else
    echo "❌ Frontend (Nginx) - Falha"
fi

echo ""
echo "🎉 Sistema iniciado com sucesso!"
echo "=================================================="
echo "📱 Interface Web: http://localhost:8080"
echo "🔧 API Backend: http://localhost:5000"
echo "💬 WhatsApp Service: http://localhost:3000"
echo ""
echo "📋 Próximos passos:"
echo "1. Acesse http://localhost:8080 no seu navegador"
echo "2. Escaneie o QR Code do WhatsApp quando solicitado"
echo "3. Configure suas credenciais SMTP no arquivo .env se ainda não fez"
echo "4. Comece a agendar suas mensagens!"
echo ""
echo "📖 Para mais informações, consulte o README.md"
echo "🔍 Para ver logs: docker-compose logs -f"
echo "🛑 Para parar: docker-compose down"
echo ""
echo "✨ Bom uso do sistema!"

