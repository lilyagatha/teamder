import { config } from 'dotenv'
import populateEnv from 'populate-env'

config()

export let env = {
  DB_NAME: '',
  DB_USERNAME: '',
  DB_PASSWORD: '',
  SESSION_SECRET: '',
  PORT: 8080,
}


populateEnv(env, { mode: 'halt' })
