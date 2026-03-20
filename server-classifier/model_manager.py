import logging
from huggingface_hub import HfApi
from classifier import Classifier
from config import HF_TOKEN, ORG_NAME, MODEL_VERSION

logger = logging.getLogger(__name__)
model = None


def get_latest_model_version():
    try:
        api = HfApi()
        models = api.list_models(author=ORG_NAME, token=HF_TOKEN)
        versions = []
        for model_info in models:
            model_id = model_info.modelId
            if model_id.startswith(f"{ORG_NAME}/"):
                version = model_id.replace(f"{ORG_NAME}/", "")
                versions.append(version)
        if not versions:
            return None
        versions.sort(reverse=True)
        return versions[0]
    except Exception as e:
        logger.error(f"Error fetching latest model version: {e}")
        return None


def get_model(version=None):
    global model
    if version is None:
        return model
    if (model is None) or (model.version != version):
        model = Classifier(version=version, token=HF_TOKEN)
        try:
            model.load_model()
        except Exception:
            pass
    return model


def load_latest_model():
    global model
    latest_version = get_latest_model_version()
    if not latest_version:
        raise RuntimeError("No model version found on HuggingFace.")
    latest_version = MODEL_VERSION  # pinned
    model = get_model(version=latest_version)
    if model is None or not hasattr(model, "classifier") or model.classifier is None:
        raise RuntimeError(
            f"Model '{latest_version}' loaded but classifier is not available."
        )
