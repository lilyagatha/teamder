import { print } from 'listening-on'
import { app } from './app'
import http from 'http'
import { env } from './env'
import { attachServer } from './io'

export let server = http.createServer(app)
attachServer(server)

server.listen(env.PORT, () => {
  print(env.PORT)
})
