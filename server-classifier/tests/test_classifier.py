import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from classifier import Classifier


def test_extract_features():
    classifier = Classifier(version="test", token="")
    data = [
        {
            "apprenant.date_de_naissance": "2002-07-28T00:00:00.000Z",
            "formation.date_inscription": "2025-11-10T00:00:00.000Z",
            "formation.date_fin": "2027-05-09T00:00:00.000Z",
            "formation.date_entree": "2025-11-10T00:00:00.000Z",
            "contrat.date_debut": "2025-11-10T00:00:00.000Z",
            "contrat.date_fin": "2027-05-09T00:00:00.000Z",
            "contrat.date_rupture": "2025-12-15T00:00:00.000Z",
        }
    ]
    features = classifier.extract_features(data)
    assert features.shape == (1, 7)
    assert all(isinstance(v, (int, float)) for v in features.iloc[0])
