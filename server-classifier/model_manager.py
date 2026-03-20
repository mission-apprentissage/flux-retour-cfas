import logging

from classifier import Classifier
from config import HF_TOKEN, MODEL_VERSION

logger = logging.getLogger(__name__)
model = None


def get_model(version=None):
    global model
    if version is None:
        return model
    if (model is None) or (model.version != version):
        model = Classifier(version=version, token=HF_TOKEN)
        try:
            model.load_model()
        except Exception as e:
            logger.error("Failed to load model version '%s': %s", version, e, exc_info=True)
            model = None
    return model


def load_latest_model():
    global model
    model = get_model(version=MODEL_VERSION)
    if model is None or not hasattr(model, "classifier") or model.classifier is None:
        raise RuntimeError(f"Model '{MODEL_VERSION}' loaded but classifier is not available.")
