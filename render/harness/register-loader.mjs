// Registra il field-stub-loader prima del modulo entry.
// Uso: node --import ./register-loader.mjs generate-score.mjs [out.scd]
import { register } from 'node:module';
register('./field-stub-loader.mjs', import.meta.url);
