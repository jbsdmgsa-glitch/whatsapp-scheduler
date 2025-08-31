from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv
from scheduler import init_scheduler, schedule_message, schedule_video, schedule_email

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permitir CORS para todas as rotas

# Configuração do banco de dados
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# Modelo para agendamentos
class ScheduledMessage(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    type = db.Column(db.String(20), nullable=False)  # 'whatsapp_text', 'whatsapp_video', 'email'
    recipient = db.Column(db.String(255), nullable=False)  # group_id ou email
    content = db.Column(db.Text, nullable=False)  # texto da mensagem
    media_url = db.Column(db.String(500))  # URL do vídeo (se aplicável)
    caption = db.Column(db.Text)  # legenda do vídeo (se aplicável)
    scheduled_time = db.Column(db.DateTime, nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, sent, failed
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Criar tabelas
with app.app_context():
    db.create_all()

# Inicializar o scheduler
scheduler = init_scheduler()

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'WhatsApp Scheduler API is running'})

@app.route('/schedule/message', methods=['POST'])
def schedule_whatsapp_message():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not all(key in data for key in ['group_id', 'text', 'datetime']):
            return jsonify({'error': 'Campos obrigatórios: group_id, text, datetime'}), 400
        
        # Converter string de data para datetime
        try:
            scheduled_time = datetime.strptime(data['datetime'], '%Y-%m-%d %H:%M')
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use: YYYY-MM-DD HH:MM'}), 400
        
        # Verificar se a data não é no passado
        if scheduled_time <= datetime.now():
            return jsonify({'error': 'A data deve ser no futuro'}), 400
        
        # Salvar no banco de dados
        message = ScheduledMessage(
            type='whatsapp_text',
            recipient=data['group_id'],
            content=data['text'],
            scheduled_time=scheduled_time
        )
        db.session.add(message)
        db.session.commit()
        
        # Agendar a mensagem
        schedule_message(scheduler, message.id, data['group_id'], data['text'], scheduled_time)
        
        return jsonify({
            'success': True,
            'message': 'Mensagem agendada com sucesso',
            'id': message.id,
            'scheduled_time': scheduled_time.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedule/video', methods=['POST'])
def schedule_whatsapp_video():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not all(key in data for key in ['group_id', 'video_url', 'datetime']):
            return jsonify({'error': 'Campos obrigatórios: group_id, video_url, datetime'}), 400
        
        # Converter string de data para datetime
        try:
            scheduled_time = datetime.strptime(data['datetime'], '%Y-%m-%d %H:%M')
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use: YYYY-MM-DD HH:MM'}), 400
        
        # Verificar se a data não é no passado
        if scheduled_time <= datetime.now():
            return jsonify({'error': 'A data deve ser no futuro'}), 400
        
        # Salvar no banco de dados
        message = ScheduledMessage(
            type='whatsapp_video',
            recipient=data['group_id'],
            content='',  # Vídeo não tem texto principal
            media_url=data['video_url'],
            caption=data.get('caption', ''),
            scheduled_time=scheduled_time
        )
        db.session.add(message)
        db.session.commit()
        
        # Agendar o vídeo
        schedule_video(scheduler, message.id, data['group_id'], data['video_url'], 
                      data.get('caption', ''), scheduled_time)
        
        return jsonify({
            'success': True,
            'message': 'Vídeo agendado com sucesso',
            'id': message.id,
            'scheduled_time': scheduled_time.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedule/email', methods=['POST'])
def schedule_email_message():
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not all(key in data for key in ['email', 'subject', 'text', 'datetime']):
            return jsonify({'error': 'Campos obrigatórios: email, subject, text, datetime'}), 400
        
        # Converter string de data para datetime
        try:
            scheduled_time = datetime.strptime(data['datetime'], '%Y-%m-%d %H:%M')
        except ValueError:
            return jsonify({'error': 'Formato de data inválido. Use: YYYY-MM-DD HH:MM'}), 400
        
        # Verificar se a data não é no passado
        if scheduled_time <= datetime.now():
            return jsonify({'error': 'A data deve ser no futuro'}), 400
        
        # Salvar no banco de dados
        message = ScheduledMessage(
            type='email',
            recipient=data['email'],
            content=f"Subject: {data['subject']}\n\n{data['text']}",
            scheduled_time=scheduled_time
        )
        db.session.add(message)
        db.session.commit()
        
        # Agendar o e-mail
        schedule_email(scheduler, message.id, data['email'], data['subject'], 
                      data['text'], data.get('attachments', []), scheduled_time)
        
        return jsonify({
            'success': True,
            'message': 'E-mail agendado com sucesso',
            'id': message.id,
            'scheduled_time': scheduled_time.isoformat()
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedules', methods=['GET'])
def list_schedules():
    try:
        # Buscar agendamentos futuros
        schedules = ScheduledMessage.query.filter(
            ScheduledMessage.scheduled_time > datetime.now(),
            ScheduledMessage.status == 'pending'
        ).order_by(ScheduledMessage.scheduled_time).all()
        
        result = []
        for schedule in schedules:
            result.append({
                'id': schedule.id,
                'type': schedule.type,
                'recipient': schedule.recipient,
                'content': schedule.content[:100] + '...' if len(schedule.content) > 100 else schedule.content,
                'media_url': schedule.media_url,
                'caption': schedule.caption,
                'scheduled_time': schedule.scheduled_time.isoformat(),
                'status': schedule.status,
                'created_at': schedule.created_at.isoformat()
            })
        
        return jsonify({
            'success': True,
            'schedules': result,
            'total': len(result)
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/schedules/<int:schedule_id>', methods=['DELETE'])
def cancel_schedule(schedule_id):
    try:
        schedule = ScheduledMessage.query.get(schedule_id)
        if not schedule:
            return jsonify({'error': 'Agendamento não encontrado'}), 404
        
        # Remover do scheduler
        try:
            scheduler.remove_job(f'job_{schedule_id}')
        except:
            pass  # Job pode não existir mais
        
        # Marcar como cancelado
        schedule.status = 'cancelled'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Agendamento cancelado com sucesso'
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

