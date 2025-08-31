from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.date import DateTrigger
from datetime import datetime
import requests
import logging
from email_service import send_email

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def init_scheduler():
    """Inicializa o scheduler em background"""
    scheduler = BackgroundScheduler()
    scheduler.start()
    logger.info("Scheduler iniciado com sucesso")
    return scheduler

def send_whatsapp_message(message_id, group_id, text):
    """Envia mensagem de texto para o WhatsApp"""
    try:
        # URL do serviço Node.js do WhatsApp
        whatsapp_url = "http://localhost:3000/send-message"
        
        payload = {
            'group_id': group_id,
            'text': text
        }
        
        response = requests.post(whatsapp_url, json=payload, timeout=30)
        
        if response.status_code == 200:
            logger.info(f"Mensagem {message_id} enviada com sucesso para {group_id}")
            update_message_status(message_id, 'sent')
        else:
            logger.error(f"Erro ao enviar mensagem {message_id}: {response.text}")
            update_message_status(message_id, 'failed')
            
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem {message_id}: {str(e)}")
        update_message_status(message_id, 'failed')

def send_whatsapp_video(message_id, group_id, video_url, caption):
    """Envia vídeo para o WhatsApp"""
    try:
        # URL do serviço Node.js do WhatsApp
        whatsapp_url = "http://localhost:3000/send-video"
        
        payload = {
            'group_id': group_id,
            'video_url': video_url,
            'caption': caption
        }
        
        response = requests.post(whatsapp_url, json=payload, timeout=60)
        
        if response.status_code == 200:
            logger.info(f"Vídeo {message_id} enviado com sucesso para {group_id}")
            update_message_status(message_id, 'sent')
        else:
            logger.error(f"Erro ao enviar vídeo {message_id}: {response.text}")
            update_message_status(message_id, 'failed')
            
    except Exception as e:
        logger.error(f"Erro ao enviar vídeo {message_id}: {str(e)}")
        update_message_status(message_id, 'failed')

def send_scheduled_email(message_id, email, subject, text, attachments):
    """Envia e-mail agendado"""
    try:
        success = send_email(email, subject, text, attachments)
        
        if success:
            logger.info(f"E-mail {message_id} enviado com sucesso para {email}")
            update_message_status(message_id, 'sent')
        else:
            logger.error(f"Erro ao enviar e-mail {message_id}")
            update_message_status(message_id, 'failed')
            
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail {message_id}: {str(e)}")
        update_message_status(message_id, 'failed')

def update_message_status(message_id, status):
    """Atualiza o status da mensagem no banco de dados"""
    try:
        from app import db, ScheduledMessage
        with db.app.app_context():
            message = ScheduledMessage.query.get(message_id)
            if message:
                message.status = status
                db.session.commit()
                logger.info(f"Status da mensagem {message_id} atualizado para {status}")
    except Exception as e:
        logger.error(f"Erro ao atualizar status da mensagem {message_id}: {str(e)}")

def schedule_message(scheduler, message_id, group_id, text, scheduled_time):
    """Agenda uma mensagem de texto do WhatsApp"""
    job_id = f'job_{message_id}'
    
    scheduler.add_job(
        func=send_whatsapp_message,
        trigger=DateTrigger(run_date=scheduled_time),
        args=[message_id, group_id, text],
        id=job_id,
        name=f'WhatsApp Message {message_id}'
    )
    
    logger.info(f"Mensagem {message_id} agendada para {scheduled_time}")

def schedule_video(scheduler, message_id, group_id, video_url, caption, scheduled_time):
    """Agenda um vídeo do WhatsApp"""
    job_id = f'job_{message_id}'
    
    scheduler.add_job(
        func=send_whatsapp_video,
        trigger=DateTrigger(run_date=scheduled_time),
        args=[message_id, group_id, video_url, caption],
        id=job_id,
        name=f'WhatsApp Video {message_id}'
    )
    
    logger.info(f"Vídeo {message_id} agendado para {scheduled_time}")

def schedule_email(scheduler, message_id, email, subject, text, attachments, scheduled_time):
    """Agenda um e-mail"""
    job_id = f'job_{message_id}'
    
    scheduler.add_job(
        func=send_scheduled_email,
        trigger=DateTrigger(run_date=scheduled_time),
        args=[message_id, email, subject, text, attachments],
        id=job_id,
        name=f'Email {message_id}'
    )
    
    logger.info(f"E-mail {message_id} agendado para {scheduled_time}")

