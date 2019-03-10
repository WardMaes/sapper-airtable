import sirv from 'sirv'
import polka from 'polka'
import compression from 'compression'
import * as sapper from '@sapper/server'
import fetch from 'node-fetch'

const { PORT, NODE_ENV } = process.env
const dev = NODE_ENV === 'development'

global.fetch = fetch

polka() // You can also use Express
  .use(
    compression({ threshold: 0 }),
    sirv('static', { dev }),
    sapper.middleware()
  )
  .listen(PORT, err => {
    if (err) console.log('error', err)
  })
