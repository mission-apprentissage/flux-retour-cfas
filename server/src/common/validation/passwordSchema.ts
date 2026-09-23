import { z } from "zod";

const DEFAULT_PASSWORD_MIN_LENGTH = 12;
export const ADMIN_PASSWORD_MIN_LENGTH = 20;

export const zPassword = (minLength: number = DEFAULT_PASSWORD_MIN_LENGTH) =>
  z
    .string()
    .min(minLength, `Le mot de passe doit contenir au moins ${minLength} caractères`)
    .regex(/[a-z]/, "Le mot de passe doit contenir au moins 1 lettre minuscule")
    .regex(/[A-Z]/, "Le mot de passe doit contenir au moins 1 lettre majuscule")
    .regex(/\d/, "Le mot de passe doit contenir au moins 1 chiffre")
    .regex(/[^a-zA-Z0-9]/, "Le mot de passe doit contenir au moins 1 caractère spécial");
