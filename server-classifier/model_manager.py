import logging
from models import Contact, WhatsApp
from config import HF_TOKEN, CONTACT_MODEL_VERSION, WHATSAPP_MODEL_VERSION

logger = logging.getLogger(__name__)
contact_model = None
wa_model = None

def get_model(origin="contact", version=None):
    if origin == "contact":
        global contact_model
        if version is None:
            return contact_model
        if (contact_model is None) or (contact_model.version != version):
            contact_model = Contact(version=version, token=HF_TOKEN)
            try:
                contact_model.load_model()
            except Exception as e:
                logger.error("Failed to load contact model version '%s': %s", version, e, exc_info=True)
                contact_model = None
        return contact_model

    elif origin == "whatsapp":
        global wa_model
        if version is None:
            return wa_model
        if (wa_model is None) or (wa_model.version != version):
            wa_model = WhatsApp(version=version, token=HF_TOKEN)
            try:
                wa_model.load_model()
            except Exception as e:
                logger.error("Failed to load whatsapp model version '%s': %s", version, e, exc_info=True)
                wa_model = None
        return wa_model

    else:
        logger.error("Unknown model origin '%s'", origin)
        return None


def load_latest_models():
    global contact_model, wa_model
    contact_model = get_model(origin="contact", version=CONTACT_MODEL_VERSION)
    wa_model = get_model(origin="whatsapp", version=WHATSAPP_MODEL_VERSION)

    if contact_model is None or not hasattr(contact_model, "classifier") or contact_model.classifier is None:
        raise RuntimeError(f"Contact model '{CONTACT_MODEL_VERSION}' loaded but classifier is not available.")

    if wa_model is None or not hasattr(wa_model, "classifier") or wa_model.classifier is None:
        raise RuntimeError(f"WhatsApp model '{WHATSAPP_MODEL_VERSION}' loaded but classifier is not available.")


