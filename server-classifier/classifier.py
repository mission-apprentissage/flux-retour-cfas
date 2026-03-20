from datasets import Dataset, load_dataset
import joblib
from pathlib import Path
from tempfile import mkdtemp, mkstemp
from huggingface_hub import hf_hub_download, ModelCard, ModelCardData, EvalResult
from huggingface_hub import HfApi
from tqdm import tqdm
import logging
import numpy as np
import pandas as pd
from sklearn.impute import SimpleImputer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.pipeline import make_pipeline
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from imblearn.over_sampling import SMOTE
from imblearn.pipeline import Pipeline as ImbPipeline

tqdm.pandas()
logger = logging.getLogger(__name__)


class Classifier:
    def __init__(self, version="2026-03-16", token=""):
        self.version = version
        self.model_file = f"tba-rf-ml-{version}.joblib"
        self.repo_id = f"tableaudebord-apprentissage/{version}"
        self.token = token
        self.classifier = None
        self.dataset = None

    def save_model(self):
        logger.info("Save model locally...")
        local_repo = mkdtemp(prefix="tba-")
        with open(Path(local_repo) / self.model_file, mode="bw") as f:
            joblib.dump(self.classifier, file=f)
        api = HfApi()
        try:
            api.delete_repo(repo_id=self.repo_id, token=self.token)
        except Exception:
            pass
        api.create_repo(
            repo_id=self.repo_id, token=self.token, repo_type="model", private=True
        )
        api.upload_folder(
            folder_path=local_repo,
            repo_id=self.repo_id,
            token=self.token,
            repo_type="model",
            commit_message=f"pushing model '{self.version}' RF for contact prediction",
        )
        url = f"https://huggingface.co/{self.repo_id}"
        return url

    def load_model(self):
        model_dump = hf_hub_download(
            repo_id=self.repo_id, filename=self.model_file, token=self.token
        )
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
        features = features.map(
            lambda x: today - pd.to_datetime(str(x), utc=True, errors="coerce")
        )
        features = features.map(
            lambda x: x.days if isinstance(x, pd.Timedelta) else 0
        )
        return features

    def score(self, data):
        features = self.extract_features(data)
        y_probs = self.classifier.predict_proba(features)[:, 1]
        return {"model": self.version, "scores": y_probs.tolist()}
