import logging
from pathlib import Path
from tempfile import mkdtemp

import joblib
import pandas as pd
from huggingface_hub import HfApi, hf_hub_download
from tqdm import tqdm

tqdm.pandas()
logger = logging.getLogger(__name__)

class WhatsApp:
    def __init__(self, version="wa-2026-03-26", token=""):
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
        data_cols = [
            "apprenant.date_de_naissance",
            "formation.date_inscription",
            "formation.date_fin",
            "formation.date_entree",
            "contrat.date_debut",
            "contrat.date_fin",
            "contrat.date_rupture",
            "apprenant.sexe",
            "mission_locale",
            "deja_connu"
        ]
        features = pd.DataFrame(data)[data_cols]

        # Prepare date features
        date_cols = ['apprenant.date_de_naissance',
                    'formation.date_inscription',
                    'formation.date_fin',
                    'formation.date_entree',
                    'contrat.date_debut',
                    'contrat.date_fin',
                    'contrat.date_rupture',
        ]
        features[date_cols] = features[date_cols].map(lambda x: pd.to_datetime(str(x), utc=True, errors='coerce')) # Cast as date
        features[date_cols] = features[date_cols].sub(features['formation.date_fin'], axis=0) # Diff with end date
        features[date_cols] = features[date_cols].map(lambda x: x.days if isinstance(x, pd.Timedelta) else 0) # Keep days

        # Prepare cat features
        cat_cols = ['apprenant.sexe', 'mission_locale', 'deja_connu']
        features[cat_cols] = features[cat_cols].fillna('').astype(str)
        features['deja_connu'] = features['deja_connu'].replace({'':'0.0'})
        return features

    def score(self, data):
        features = self.extract_features(data)
        y_probs = self.classifier.predict_proba(features)[:, 1]
        return {"model": self.version, "scores": y_probs.tolist()}
