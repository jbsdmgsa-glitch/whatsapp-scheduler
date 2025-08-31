const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Cliente WhatsApp
const client = new Client({
    authStrategy: new LocalAuth({
        clientId: "whatsapp-scheduler"
    }),
    puppeteer: {
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--single-process',
            '--disable-gpu'
        ]
    }
});

let isClientReady = false;

// Eventos do cliente WhatsApp
client.on('qr', (qr) => {
    console.log('QR Code recebido. Escaneie com seu WhatsApp:');
    console.log(qr);
    
    // Salvar QR code em arquivo para facilitar o acesso
    fs.writeFileSync(path.join(__dirname, 'qr.txt'), qr);
    console.log('QR Code salvo em qr.txt');
});

client.on('ready', () => {
    console.log('Cliente WhatsApp está pronto!');
    isClientReady = true;
});

client.on('authenticated', () => {
    console.log('WhatsApp autenticado com sucesso!');
});

client.on('auth_failure', msg => {
    console.error('Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    isClientReady = false;
});

// Inicializar cliente
client.initialize();

// Função auxiliar para encontrar chat por ID
async function findChatById(chatId) {
    try {
        const chats = await client.getChats();
        return chats.find(chat => 
            chat.id._serialized === chatId || 
            chat.id.user === chatId ||
            chat.name === chatId
        );
    } catch (error) {
        console.error('Erro ao buscar chat:', error);
        return null;
    }
}

// Rotas da API

// Status do serviço
app.get('/status', (req, res) => {
    res.json({
        status: 'running',
        whatsapp_ready: isClientReady,
        timestamp: new Date().toISOString()
    });
});

// Listar chats/grupos
app.get('/chats', async (req, res) => {
    try {
        if (!isClientReady) {
            return res.status(503).json({
                error: 'WhatsApp não está pronto. Verifique a autenticação.'
            });
        }

        const chats = await client.getChats();
        const chatList = chats.map(chat => ({
            id: chat.id._serialized,
            name: chat.name || chat.pushname || 'Sem nome',
            isGroup: chat.isGroup,
            participants: chat.isGroup ? chat.participants.length : 1
        }));

        res.json({
            success: true,
            chats: chatList,
            total: chatList.length
        });
    } catch (error) {
        console.error('Erro ao listar chats:', error);
        res.status(500).json({
            error: 'Erro ao listar chats',
            details: error.message
        });
    }
});

// Enviar mensagem de texto
app.post('/send-message', async (req, res) => {
    try {
        const { group_id, text } = req.body;

        if (!group_id || !text) {
            return res.status(400).json({
                error: 'Campos obrigatórios: group_id, text'
            });
        }

        if (!isClientReady) {
            return res.status(503).json({
                error: 'WhatsApp não está pronto. Verifique a autenticação.'
            });
        }

        // Encontrar o chat
        const chat = await findChatById(group_id);
        if (!chat) {
            return res.status(404).json({
                error: 'Chat/Grupo não encontrado'
            });
        }

        // Enviar mensagem
        await chat.sendMessage(text);

        console.log(`Mensagem enviada para ${chat.name || group_id}: ${text.substring(0, 50)}...`);

        res.json({
            success: true,
            message: 'Mensagem enviada com sucesso',
            chat_name: chat.name || 'Sem nome',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({
            error: 'Erro ao enviar mensagem',
            details: error.message
        });
    }
});

// Enviar vídeo
app.post('/send-video', async (req, res) => {
    try {
        const { group_id, video_url, caption } = req.body;

        if (!group_id || !video_url) {
            return res.status(400).json({
                error: 'Campos obrigatórios: group_id, video_url'
            });
        }

        if (!isClientReady) {
            return res.status(503).json({
                error: 'WhatsApp não está pronto. Verifique a autenticação.'
            });
        }

        // Encontrar o chat
        const chat = await findChatById(group_id);
        if (!chat) {
            return res.status(404).json({
                error: 'Chat/Grupo não encontrado'
            });
        }

        // Criar media do vídeo
        const media = await MessageMedia.fromUrl(video_url);
        
        // Enviar vídeo com legenda
        await chat.sendMessage(media, { caption: caption || '' });

        console.log(`Vídeo enviado para ${chat.name || group_id} com legenda: ${caption || 'sem legenda'}`);

        res.json({
            success: true,
            message: 'Vídeo enviado com sucesso',
            chat_name: chat.name || 'Sem nome',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('Erro ao enviar vídeo:', error);
        res.status(500).json({
            error: 'Erro ao enviar vídeo',
            details: error.message
        });
    }
});

// Obter QR Code para autenticação
app.get('/qr', (req, res) => {
    try {
        const qrPath = path.join(__dirname, 'qr.txt');
        if (fs.existsSync(qrPath)) {
            const qr = fs.readFileSync(qrPath, 'utf8');
            res.json({
                success: true,
                qr: qr,
                message: 'Escaneie este QR Code com seu WhatsApp'
            });
        } else {
            res.json({
                success: false,
                message: 'QR Code não disponível. O WhatsApp pode já estar autenticado.'
            });
        }
    } catch (error) {
        res.status(500).json({
            error: 'Erro ao obter QR Code',
            details: error.message
        });
    }
});

// Iniciar servidor
app.listen(port, '0.0.0.0', () => {
    console.log(`Serviço WhatsApp rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port}/status para verificar o status`);
});

// Tratamento de sinais para encerramento gracioso
process.on('SIGINT', async () => {
    console.log('Encerrando serviço WhatsApp...');
    await client.destroy();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('Encerrando serviço WhatsApp...');
    await client.destroy();
    process.exit(0);
});

