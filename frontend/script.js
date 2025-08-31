// Configuração da API
const API_BASE_URL = 'http://localhost:5000';
const WHATSAPP_BASE_URL = 'http://localhost:3000';

// Estado da aplicação
let currentTab = 'whatsapp';
let whatsappStatus = 'connecting';
let availableChats = [];

// Elementos DOM
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const messageTypeSelect = document.getElementById('messageType');
const textGroup = document.getElementById('textGroup');
const videoGroup = document.getElementById('videoGroup');
const loadChatsBtn = document.getElementById('loadChats');
const chatsList = document.getElementById('chatsList');
const chatsContainer = document.getElementById('chatsContainer');
const whatsappForm = document.getElementById('whatsappForm');
const emailForm = document.getElementById('emailForm');
const refreshSchedulesBtn = document.getElementById('refreshSchedules');
const schedulesContainer = document.getElementById('schedulesContainer');
const qrModal = document.getElementById('qrModal');
const closeQrModal = document.getElementById('closeQrModal');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const toastContainer = document.getElementById('toastContainer');

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    checkWhatsAppStatus();
    loadSchedules();
    setMinDateTime();
}

function setupEventListeners() {
    // Navegação entre abas
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });

    // Alternar entre texto e vídeo no WhatsApp
    messageTypeSelect.addEventListener('change', toggleMessageType);

    // Carregar chats do WhatsApp
    loadChatsBtn.addEventListener('click', loadWhatsAppChats);

    // Formulários
    whatsappForm.addEventListener('submit', handleWhatsAppSubmit);
    emailForm.addEventListener('submit', handleEmailSubmit);

    // Atualizar agendamentos
    refreshSchedulesBtn.addEventListener('click', loadSchedules);

    // Modal QR Code
    closeQrModal.addEventListener('click', closeQrCodeModal);
    qrModal.addEventListener('click', (e) => {
        if (e.target === qrModal) closeQrCodeModal();
    });

    // Verificar status periodicamente
    setInterval(checkWhatsAppStatus, 10000);
}

function switchTab(tabName) {
    currentTab = tabName;
    
    // Atualizar botões
    tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Atualizar conteúdo
    tabContents.forEach(content => {
        content.classList.toggle('active', content.id === `${tabName}-tab`);
    });
    
    // Carregar dados específicos da aba
    if (tabName === 'schedules') {
        loadSchedules();
    }
}

function toggleMessageType() {
    const isVideo = messageTypeSelect.value === 'video';
    textGroup.style.display = isVideo ? 'none' : 'block';
    videoGroup.style.display = isVideo ? 'block' : 'none';
    
    // Atualizar campos obrigatórios
    document.getElementById('messageText').required = !isVideo;
    document.getElementById('videoUrl').required = isVideo;
}

async function checkWhatsAppStatus() {
    try {
        const response = await fetch(`${WHATSAPP_BASE_URL}/status`);
        const data = await response.json();
        
        if (data.whatsapp_ready) {
            updateStatus('connected', 'WhatsApp Conectado');
        } else {
            updateStatus('connecting', 'WhatsApp Conectando...');
            // Mostrar QR Code se necessário
            showQrCodeIfNeeded();
        }
    } catch (error) {
        updateStatus('error', 'WhatsApp Desconectado');
        console.error('Erro ao verificar status:', error);
    }
}

function updateStatus(status, text) {
    whatsappStatus = status;
    statusDot.className = `status-dot ${status}`;
    statusText.textContent = text;
}

async function showQrCodeIfNeeded() {
    try {
        const response = await fetch(`${WHATSAPP_BASE_URL}/qr`);
        const data = await response.json();
        
        if (data.success && data.qr) {
            showQrCodeModal(data.qr);
        }
    } catch (error) {
        console.error('Erro ao obter QR Code:', error);
    }
}

function showQrCodeModal(qrCode) {
    qrCodeContainer.innerHTML = `<pre>${qrCode}</pre>`;
    qrModal.classList.add('show');
}

function closeQrCodeModal() {
    qrModal.classList.remove('show');
}

async function loadWhatsAppChats() {
    if (whatsappStatus !== 'connected') {
        showToast('Erro', 'WhatsApp não está conectado', 'error');
        return;
    }
    
    loadChatsBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Carregando...';
    loadChatsBtn.disabled = true;
    
    try {
        const response = await fetch(`${WHATSAPP_BASE_URL}/chats`);
        const data = await response.json();
        
        if (data.success) {
            availableChats = data.chats;
            displayChats(data.chats);
            chatsList.style.display = 'block';
            showToast('Sucesso', `${data.chats.length} chats carregados`, 'success');
        } else {
            showToast('Erro', 'Erro ao carregar chats', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar chats:', error);
        showToast('Erro', 'Erro ao conectar com o WhatsApp', 'error');
    } finally {
        loadChatsBtn.innerHTML = '<i class="fas fa-refresh"></i> Carregar grupos disponíveis';
        loadChatsBtn.disabled = false;
    }
}

function displayChats(chats) {
    chatsContainer.innerHTML = '';
    
    chats.forEach(chat => {
        const chatElement = document.createElement('div');
        chatElement.className = 'chat-item';
        chatElement.innerHTML = `
            <div class="chat-info">
                <div class="chat-name">${chat.name}</div>
                <div class="chat-id">${chat.id}</div>
            </div>
            <div class="chat-type ${chat.isGroup ? 'group' : 'contact'}">
                ${chat.isGroup ? 'Grupo' : 'Contato'}
                ${chat.isGroup ? ` (${chat.participants})` : ''}
            </div>
        `;
        
        chatElement.addEventListener('click', () => {
            document.getElementById('groupId').value = chat.id;
            chatsList.style.display = 'none';
        });
        
        chatsContainer.appendChild(chatElement);
    });
}

async function handleWhatsAppSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const messageType = messageTypeSelect.value;
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
    submitBtn.disabled = true;
    
    try {
        let endpoint, payload;
        
        if (messageType === 'text') {
            endpoint = '/schedule/message';
            payload = {
                group_id: document.getElementById('groupId').value,
                text: document.getElementById('messageText').value,
                datetime: document.getElementById('scheduleDateTime').value.replace('T', ' ')
            };
        } else {
            endpoint = '/schedule/video';
            payload = {
                group_id: document.getElementById('groupId').value,
                video_url: document.getElementById('videoUrl').value,
                caption: document.getElementById('videoCaption').value,
                datetime: document.getElementById('scheduleDateTime').value.replace('T', ' ')
            };
        }
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Sucesso', 'Mensagem agendada com sucesso!', 'success');
            e.target.reset();
            setMinDateTime();
            loadSchedules();
        } else {
            showToast('Erro', data.error || 'Erro ao agendar mensagem', 'error');
        }
    } catch (error) {
        console.error('Erro ao agendar mensagem:', error);
        showToast('Erro', 'Erro ao conectar com o servidor', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function handleEmailSubmit(e) {
    e.preventDefault();
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Agendando...';
    submitBtn.disabled = true;
    
    try {
        const payload = {
            email: document.getElementById('emailTo').value,
            subject: document.getElementById('emailSubject').value,
            text: document.getElementById('emailText').value,
            datetime: document.getElementById('emailDateTime').value.replace('T', ' ')
        };
        
        const response = await fetch(`${API_BASE_URL}/schedule/email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Sucesso', 'E-mail agendado com sucesso!', 'success');
            e.target.reset();
            setMinDateTime();
            loadSchedules();
        } else {
            showToast('Erro', data.error || 'Erro ao agendar e-mail', 'error');
        }
    } catch (error) {
        console.error('Erro ao agendar e-mail:', error);
        showToast('Erro', 'Erro ao conectar com o servidor', 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

async function loadSchedules() {
    schedulesContainer.innerHTML = '<div class="loading"><i class="fas fa-spinner fa-spin"></i> Carregando agendamentos...</div>';
    
    try {
        const response = await fetch(`${API_BASE_URL}/schedules`);
        const data = await response.json();
        
        if (data.success) {
            displaySchedules(data.schedules);
        } else {
            schedulesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><h3>Erro ao carregar</h3><p>Não foi possível carregar os agendamentos.</p></div>';
        }
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        schedulesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-wifi"></i><h3>Erro de conexão</h3><p>Não foi possível conectar com o servidor.</p></div>';
    }
}

function displaySchedules(schedules) {
    if (schedules.length === 0) {
        schedulesContainer.innerHTML = '<div class="empty-state"><i class="fas fa-calendar-alt"></i><h3>Nenhum agendamento</h3><p>Você ainda não tem mensagens agendadas.</p></div>';
        return;
    }
    
    schedulesContainer.innerHTML = '';
    
    schedules.forEach(schedule => {
        const scheduleElement = document.createElement('div');
        scheduleElement.className = 'schedule-item';
        
        const typeIcon = getTypeIcon(schedule.type);
        const typeLabel = getTypeLabel(schedule.type);
        const scheduledDate = new Date(schedule.scheduled_time);
        
        scheduleElement.innerHTML = `
            <div class="schedule-header">
                <div class="schedule-type">
                    <i class="${typeIcon}"></i>
                    ${typeLabel}
                </div>
                <div class="schedule-actions">
                    <button class="btn btn-danger" onclick="cancelSchedule(${schedule.id})">
                        <i class="fas fa-trash"></i>
                        Cancelar
                    </button>
                </div>
            </div>
            <div class="schedule-info">
                <div class="schedule-field">
                    <label>Destinatário</label>
                    <span>${schedule.recipient}</span>
                </div>
                <div class="schedule-field">
                    <label>Data e Hora</label>
                    <span>${scheduledDate.toLocaleString('pt-BR')}</span>
                </div>
                <div class="schedule-field">
                    <label>Status</label>
                    <span>${getStatusLabel(schedule.status)}</span>
                </div>
                <div class="schedule-field">
                    <label>Criado em</label>
                    <span>${new Date(schedule.created_at).toLocaleString('pt-BR')}</span>
                </div>
            </div>
            ${getScheduleContent(schedule)}
        `;
        
        schedulesContainer.appendChild(scheduleElement);
    });
}

function getTypeIcon(type) {
    const icons = {
        'whatsapp_text': 'fab fa-whatsapp',
        'whatsapp_video': 'fab fa-whatsapp',
        'email': 'fas fa-envelope'
    };
    return icons[type] || 'fas fa-question';
}

function getTypeLabel(type) {
    const labels = {
        'whatsapp_text': 'WhatsApp - Texto',
        'whatsapp_video': 'WhatsApp - Vídeo',
        'email': 'E-mail'
    };
    return labels[type] || 'Desconhecido';
}

function getStatusLabel(status) {
    const labels = {
        'pending': 'Pendente',
        'sent': 'Enviado',
        'failed': 'Falhou',
        'cancelled': 'Cancelado'
    };
    return labels[status] || status;
}

function getScheduleContent(schedule) {
    let content = '';
    
    if (schedule.type === 'whatsapp_text') {
        content = `
            <div class="schedule-content">
                <h4>Mensagem:</h4>
                <p>${schedule.content}</p>
            </div>
        `;
    } else if (schedule.type === 'whatsapp_video') {
        content = `
            <div class="schedule-content">
                <h4>Vídeo:</h4>
                <p><strong>URL:</strong> ${schedule.media_url}</p>
                ${schedule.caption ? `<p><strong>Legenda:</strong> ${schedule.caption}</p>` : ''}
            </div>
        `;
    } else if (schedule.type === 'email') {
        const lines = schedule.content.split('\n');
        const subject = lines[0].replace('Subject: ', '');
        const body = lines.slice(2).join('\n');
        
        content = `
            <div class="schedule-content">
                <h4>Assunto:</h4>
                <p>${subject}</p>
                <h4>Mensagem:</h4>
                <p>${body}</p>
            </div>
        `;
    }
    
    return content;
}

async function cancelSchedule(scheduleId) {
    if (!confirm('Tem certeza que deseja cancelar este agendamento?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/schedules/${scheduleId}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Sucesso', 'Agendamento cancelado com sucesso!', 'success');
            loadSchedules();
        } else {
            showToast('Erro', data.error || 'Erro ao cancelar agendamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao cancelar agendamento:', error);
        showToast('Erro', 'Erro ao conectar com o servidor', 'error');
    }
}

function setMinDateTime() {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // Mínimo 1 minuto no futuro
    const minDateTime = now.toISOString().slice(0, 16);
    
    document.getElementById('scheduleDateTime').min = minDateTime;
    document.getElementById('emailDateTime').min = minDateTime;
}

function showToast(title, message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icon = type === 'success' ? 'fas fa-check-circle' : 
                 type === 'error' ? 'fas fa-exclamation-circle' : 
                 'fas fa-info-circle';
    
    toast.innerHTML = `
        <div class="toast-header">
            <div class="toast-title">
                <i class="${icon}"></i>
                ${title}
            </div>
            <button class="toast-close">&times;</button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => {
        toast.remove();
    });
    
    toastContainer.appendChild(toast);
    
    // Auto remove após 5 segundos
    setTimeout(() => {
        if (toast.parentNode) {
            toast.remove();
        }
    }, 5000);
}

// Tornar funções globais para uso nos event handlers inline
window.cancelSchedule = cancelSchedule;

