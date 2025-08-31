import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import logging
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv()

# Configurar logging
logger = logging.getLogger(__name__)

def send_email(to_email, subject, body, attachments=None):
    """
    Envia um e-mail usando as configurações SMTP do arquivo .env
    
    Args:
        to_email (str): E-mail do destinatário
        subject (str): Assunto do e-mail
        body (str): Corpo do e-mail
        attachments (list): Lista de caminhos para arquivos anexos (opcional)
    
    Returns:
        bool: True se o e-mail foi enviado com sucesso, False caso contrário
    """
    try:
        # Obter configurações do ambiente
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        # Validar configurações
        if not all([smtp_server, smtp_username, smtp_password]):
            logger.error("Configurações SMTP não encontradas no arquivo .env")
            return False
        
        # Criar mensagem
        msg = MIMEMultipart()
        msg['From'] = smtp_username
        msg['To'] = to_email
        msg['Subject'] = subject
        
        # Adicionar corpo do e-mail
        msg.attach(MIMEText(body, 'plain', 'utf-8'))
        
        # Adicionar anexos se fornecidos
        if attachments:
            for file_path in attachments:
                if os.path.isfile(file_path):
                    with open(file_path, "rb") as attachment:
                        part = MIMEBase('application', 'octet-stream')
                        part.set_payload(attachment.read())
                    
                    encoders.encode_base64(part)
                    part.add_header(
                        'Content-Disposition',
                        f'attachment; filename= {os.path.basename(file_path)}'
                    )
                    msg.attach(part)
                else:
                    logger.warning(f"Arquivo anexo não encontrado: {file_path}")
        
        # Conectar ao servidor SMTP e enviar
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()  # Habilitar segurança
        server.login(smtp_username, smtp_password)
        
        text = msg.as_string()
        server.sendmail(smtp_username, to_email, text)
        server.quit()
        
        logger.info(f"E-mail enviado com sucesso para {to_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        logger.error("Erro de autenticação SMTP. Verifique as credenciais.")
        return False
    except smtplib.SMTPRecipientsRefused:
        logger.error(f"Destinatário recusado: {to_email}")
        return False
    except smtplib.SMTPServerDisconnected:
        logger.error("Servidor SMTP desconectado")
        return False
    except Exception as e:
        logger.error(f"Erro ao enviar e-mail: {str(e)}")
        return False

def test_email_configuration():
    """
    Testa a configuração de e-mail enviando um e-mail de teste
    
    Returns:
        bool: True se a configuração está funcionando, False caso contrário
    """
    try:
        smtp_server = os.getenv('SMTP_SERVER')
        smtp_port = int(os.getenv('SMTP_PORT', 587))
        smtp_username = os.getenv('SMTP_USERNAME')
        smtp_password = os.getenv('SMTP_PASSWORD')
        
        if not all([smtp_server, smtp_username, smtp_password]):
            logger.error("Configurações SMTP não encontradas")
            return False
        
        # Testar conexão
        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_username, smtp_password)
        server.quit()
        
        logger.info("Configuração de e-mail testada com sucesso")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao testar configuração de e-mail: {str(e)}")
        return False

def get_email_providers():
    """
    Retorna configurações comuns para provedores de e-mail populares
    
    Returns:
        dict: Dicionário com configurações de provedores
    """
    return {
        'gmail': {
            'smtp_server': 'smtp.gmail.com',
            'smtp_port': 587,
            'description': 'Gmail (requer senha de app)',
            'help_url': 'https://support.google.com/accounts/answer/185833'
        },
        'outlook': {
            'smtp_server': 'smtp-mail.outlook.com',
            'smtp_port': 587,
            'description': 'Outlook/Hotmail'
        },
        'yahoo': {
            'smtp_server': 'smtp.mail.yahoo.com',
            'smtp_port': 587,
            'description': 'Yahoo Mail'
        },
        'custom': {
            'smtp_server': 'seu.servidor.smtp.com',
            'smtp_port': 587,
            'description': 'Servidor personalizado'
        }
    }

if __name__ == "__main__":
    # Teste da configuração
    print("Testando configuração de e-mail...")
    if test_email_configuration():
        print("✅ Configuração de e-mail OK")
        
        # Teste de envio (descomente para testar)
        # test_email = input("Digite um e-mail para teste (ou Enter para pular): ")
        # if test_email:
        #     if send_email(test_email, "Teste do Sistema", "Este é um e-mail de teste do sistema de agendamento."):
        #         print("✅ E-mail de teste enviado com sucesso")
        #     else:
        #         print("❌ Erro ao enviar e-mail de teste")
    else:
        print("❌ Erro na configuração de e-mail")
        print("\nProvedores suportados:")
        for provider, config in get_email_providers().items():
            print(f"- {provider}: {config['description']}")
            print(f"  Servidor: {config['smtp_server']}:{config['smtp_port']}")
            if 'help_url' in config:
                print(f"  Ajuda: {config['help_url']}")
            print()

