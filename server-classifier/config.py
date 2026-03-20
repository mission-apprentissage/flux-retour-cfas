import os
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN")
ORG_NAME = "tableaudebord-apprentissage"
MODEL_VERSION = "2026-03-16"
SERVER_PORT = int(os.getenv("LAB_SERVER_PORT", 8000))
PUBLIC_VERSION = os.getenv("PUBLIC_VERSION", MODEL_VERSION)
