import axios from "axios"

export const getLbaTrainingLinks = (cfd: string, rncp: string) => {
    return axios.post("https://labonnealternance.apprentissage.beta.gouv.fr/traininglinks", [{ cfd, rncp }])
}
