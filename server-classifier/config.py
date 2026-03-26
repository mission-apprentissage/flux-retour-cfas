import os

from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
CLASSIFIER_API_KEY = os.getenv("CLASSIFIER_API_KEY", "")
ORG_NAME = "tableaudebord-apprentissage"
CONTACT_MODEL_VERSION = os.getenv("CONTACT_MODEL_VERSION", "2026-03-16")
WHATSAPP_MODEL_VERSION = os.getenv("WHATSAPP_MODEL_VERSION", "2026-03-26")
VERSION_PATTERN = r"^\d{4}-\d{2}-\d{2}$"
SERVER_PORT = int(os.getenv("LAB_SERVER_PORT", 8000))
MAX_BATCH_SIZE = int(os.getenv("MAX_BATCH_SIZE", 1000))
PUBLIC_VERSION = os.getenv("PUBLIC_VERSION", "2026-03-26")
