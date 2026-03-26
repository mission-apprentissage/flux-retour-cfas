import logging

import joblib
import pandas as pd
from huggingface_hub import hf_hub_download
from tqdm import tqdm

tqdm.pandas()
logger = logging.getLogger(__name__)


class Contact:
    def __init__(self, version="2026-03-16", token=""):
        self.version = version
        self.model_file = "model.joblib"
        self.repo_id = f"tableaudebord-apprentissage/{version}"
        self.token = token
        self.classifier = None
        self.dataset = None

    def load_model(self):
        model_dump = hf_hub_download(repo_id=self.repo_id, filename=self.model_file, token=self.token)
        self.classifier = joblib.load(model_dump)

    def extract_features(self, data):
        date_cols = [
            "apprenant.date_de_naissance",
            "formation.date_inscription",
            "formation.date_fin",
            "formation.date_entree",
            "contrat.date_debut",
            "contrat.date_fin",
            "contrat.date_rupture",
        ]
        features = pd.DataFrame(data)[date_cols]
        today = pd.to_datetime("today", utc=True)
        features = features.map(lambda x: today - pd.to_datetime(str(x), utc=True, errors="coerce"))
        features = features.map(lambda x: x.days if isinstance(x, pd.Timedelta) else 0)
        return features

    def score(self, data):
        features = self.extract_features(data)
        y_probs = self.classifier.predict_proba(features)[:, 1]
        return {"model": self.version, "scores": y_probs.tolist()}
