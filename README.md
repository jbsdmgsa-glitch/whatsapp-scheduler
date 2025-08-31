# Sistema de Agendamento de Mensagens WhatsApp e E-mail

Um sistema completo para agendar o envio de mensagens de texto e vídeos para WhatsApp, além de e-mails, com interface web intuitiva e APIs REST.

## 🚀 Características

- ✅ **WhatsApp**: Envio de mensagens de texto e vídeos com legenda
- ✅ **E-mail**: Envio de e-mails com texto e anexos
- ✅ **Agendamento**: Sistema de agendamento por data e hora
- ✅ **Interface Web**: Interface moderna e responsiva
- ✅ **API REST**: APIs para integração com outros sistemas
- ✅ **Docker**: Containerização completa para fácil deploy
- ✅ **Logs**: Sistema de logs para monitoramento

## 📋 Requisitos

### Desenvolvimento Local
- Python 3.10+
- Node.js 18+
- SQLite3

### Produção (Docker)
- Docker
- Docker Compose

## 🏗️ Arquitetura

```
whatsapp-scheduler/
├── server/              # Backend Python (Flask)
│   ├── app.py          # Aplicação principal
│   ├── scheduler.py    # Sistema de agendamento
│   ├── email_service.py # Serviço de e-mail
│   └── requirements.txt
├── whatsapp/           # Serviço WhatsApp (Node.js)
│   ├── index.js        # Servidor WhatsApp
│   └── package.json
├── frontend/           # Interface Web
│   ├── index.html      # Página principal
│   ├── styles.css      # Estilos
│   └── script.js       # JavaScript
├── docker-compose.yml  # Orquestração Docker
├── Dockerfile         # Container backend
└── .env              # Configurações
```

## ⚙️ Configuração

### 1. Configurar Variáveis de Ambiente

Edite o arquivo `.env`:

```env
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
```

### 2. Configuração de E-mail

#### Gmail
1. Ative a verificação em 2 etapas
2. Gere uma senha de app em: https://myaccount.google.com/apppasswords
3. Use a senha de app no campo `SMTP_PASSWORD`

#### Outros Provedores
- **Outlook**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`

## 🚀 Instalação e Execução

### Opção 1: Docker (Recomendado)

```bash
# 1. Clone o projeto
git clone <url-do-repositorio>
cd whatsapp-scheduler

# 2. Configure o arquivo .env
cp .env.example .env
# Edite o .env com suas configurações

# 3. Execute com Docker Compose
docker-compose up -d

# 4. Acesse a aplicação
# Frontend: http://localhost:8080
# Backend API: http://localhost:5000
# WhatsApp Service: http://localhost:3000
```

### Opção 2: Desenvolvimento Local

```bash
# 1. Backend Python
cd server
pip install -r requirements.txt
python app.py

# 2. Serviço WhatsApp (em outro terminal)
cd whatsapp
npm install
npm start

# 3. Frontend
# Abra frontend/index.html no navegador
# ou use um servidor HTTP local:
cd frontend
python -m http.server 8000
```

## 📱 Autenticação WhatsApp

1. Inicie o serviço WhatsApp
2. Acesse a interface web
3. Escaneie o QR Code que aparece no modal
4. Aguarde a confirmação de conexão

## 🔧 Uso da API

### Endpoints Principais

#### Agendar Mensagem de Texto WhatsApp
```http
POST /schedule/message
Content-Type: application/json

{
  "group_id": "120363123456789@g.us",
  "text": "Mensagem de teste",
  "datetime": "2025-08-27 10:00"
}
```

#### Agendar Vídeo WhatsApp
```http
POST /schedule/video
Content-Type: application/json

{
  "group_id": "120363123456789@g.us",
  "video_url": "https://exemplo.com/video.mp4",
  "caption": "Legenda do vídeo",
  "datetime": "2025-08-27 15:00"
}
```

#### Agendar E-mail
```http
POST /schedule/email
Content-Type: application/json

{
  "email": "destinatario@exemplo.com",
  "subject": "Assunto do e-mail",
  "text": "Conteúdo do e-mail",
  "datetime": "2025-08-27 09:00"
}
```

#### Listar Agendamentos
```http
GET /schedules
```

#### Cancelar Agendamento
```http
DELETE /schedules/{id}
```

### Endpoints WhatsApp Service

#### Status do Serviço
```http
GET /status
```

#### Listar Chats/Grupos
```http
GET /chats
```

#### Obter QR Code
```http
GET /qr
```

## 🖥️ Interface Web

A interface web oferece:

1. **Aba WhatsApp**: Agendar mensagens de texto e vídeo
2. **Aba E-mail**: Agendar envio de e-mails
3. **Aba Agendamentos**: Visualizar e gerenciar agendamentos futuros

### Funcionalidades da Interface

- ✅ Formulários intuitivos para cada tipo de mensagem
- ✅ Seleção de data e hora com validação
- ✅ Listagem de grupos WhatsApp disponíveis
- ✅ Visualização de agendamentos futuros
- ✅ Cancelamento de agendamentos
- ✅ Notificações de sucesso/erro
- ✅ Design responsivo para mobile

## 🔍 Monitoramento e Logs

### Logs do Sistema

Os logs são exibidos no console de cada serviço:

```bash
# Ver logs do backend
docker-compose logs -f backend

# Ver logs do WhatsApp
docker-compose logs -f whatsapp

# Ver todos os logs
docker-compose logs -f
```

### Status dos Serviços

```bash
# Verificar status dos containers
docker-compose ps

# Verificar saúde da API
curl http://localhost:5000/health

# Verificar status do WhatsApp
curl http://localhost:3000/status
```

## 🛠️ Desenvolvimento

### Estrutura do Código

#### Backend (Flask)
- `app.py`: Aplicação principal com rotas da API
- `scheduler.py`: Sistema de agendamento com APScheduler
- `email_service.py`: Serviço de envio de e-mails

#### WhatsApp Service (Node.js)
- `index.js`: Servidor Express com integração whatsapp-web.js

#### Frontend
- `index.html`: Interface principal
- `styles.css`: Estilos CSS responsivos
- `script.js`: Lógica JavaScript e integração com APIs

### Adicionando Novas Funcionalidades

1. **Nova rota da API**: Adicione em `server/app.py`
2. **Novo tipo de agendamento**: Modifique `server/scheduler.py`
3. **Nova funcionalidade WhatsApp**: Edite `whatsapp/index.js`
4. **Nova interface**: Atualize os arquivos em `frontend/`

## 🐳 Deploy em Produção

### Usando Docker Compose

```bash
# 1. Preparar ambiente
git clone <repositorio>
cd whatsapp-scheduler

# 2. Configurar produção
cp .env.example .env
# Edite .env com configurações de produção

# 3. Deploy
docker-compose -f docker-compose.yml up -d

# 4. Configurar proxy reverso (opcional)
# Configure Nginx ou Apache para proxy para porta 8080
```

### Configurações de Produção

1. **Segurança**: Use HTTPS em produção
2. **Backup**: Configure backup regular do database.db
3. **Monitoramento**: Configure logs centralizados
4. **Recursos**: Ajuste limites de CPU/memória nos containers

## 🔧 Troubleshooting

### Problemas Comuns

#### WhatsApp não conecta
- Verifique se o QR Code foi escaneado corretamente
- Reinicie o serviço WhatsApp: `docker-compose restart whatsapp`
- Verifique os logs: `docker-compose logs whatsapp`

#### E-mails não são enviados
- Verifique as configurações SMTP no `.env`
- Para Gmail, certifique-se de usar senha de app
- Teste a configuração: `python server/email_service.py`

#### Interface não carrega
- Verifique se todos os serviços estão rodando: `docker-compose ps`
- Verifique conectividade: `curl http://localhost:5000/health`
- Limpe cache do navegador

#### Agendamentos não executam
- Verifique logs do backend: `docker-compose logs backend`
- Confirme que a data/hora está no futuro
- Verifique timezone no `.env`

### Comandos Úteis

```bash
# Reiniciar todos os serviços
docker-compose restart

# Reconstruir containers
docker-compose build --no-cache

# Limpar dados do WhatsApp (forçar nova autenticação)
rm -rf whatsapp/.wwebjs_auth whatsapp/.wwebjs_cache

# Backup do banco de dados
cp database.db database_backup_$(date +%Y%m%d).db

# Ver uso de recursos
docker stats
```

## 📝 Licença

Este projeto está sob licença MIT. Veja o arquivo LICENSE para mais detalhes.

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📞 Suporte

Para suporte e dúvidas:

1. Verifique a documentação acima
2. Consulte os logs dos serviços
3. Abra uma issue no repositório

---

**Desenvolvido com ❤️ para facilitar o agendamento de mensagens**

