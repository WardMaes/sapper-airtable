export function Airtable(app, key) {
  if (app.startsWith('app')) {
    app = 'https://api.airtable.com/v0/' + app
  }
  app += '/'
  this.app = app
  this.key = key || ''
  this.config = { app, key }
  this.create = create
  this.find = find
  this.select = select
  this.update = update
  this.destroy = destroy
}
export function config() {
  return {
    app: 'https://api.airtable.com/v0/' + process.env.AIRTABLE_APP + '/',
    key: process.env.AIRTABLE_API_KEY
  }
}
export async function proxy(req, res) {
  const _fetch = require('node-fetch')
  const { app, key } = config()
  const { url } = req
  const { tbl, id } = req.params
  const urlAirtable = url.slice(url.indexOf('/' + tbl))
  if (!req.search && req.query && Object.keys(req.query).length) {
    req.search = '?' + serialize(req.query)
  }
  const body = JSON.stringify(req.body)
  const text = await _fetch(
    app + [tbl, id].filter(Boolean).join('/') + (req.search || ''),
    {
      method: req.method,
      headers: {
        Authorization: 'Bearer ' + key,
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: body === '{}' ? null : body
    }
  ).then(r => {
    res.writeHead(r.status, r.headers)
    return r.text()
  })
  res.end(text)
}
export async function create(tableName, fields) {
  const { app, key } = this ? this.config : config()
  const body = await fetch(app + tableName, {
    method: 'POST',
    headers: {
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  }).then(r => r.json())
  return unpack(body)
}
export async function find(tableName, id) {
  const { app, key } = this ? this.config : config()
  const body = await fetch(app + tableName + '/' + id, {
    headers: {
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(r => r.json())
  return unpack(body)
}
export async function select(tableName, filter) {
  console.log('select', tableName, filter)
  const { app, key } = this ? this.config : config()
  const body = await fetch(app + tableName + '?' + serialize(filter), {
    headers: {
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(r => r.json())
  return body.records.map(unpack)
}
export async function update(tableName, id, fields) {
  const { app, key } = this ? this.config : config()
  const body = await fetch(app + tableName + '/' + id, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields })
  }).then(r => r.json())
  return unpack(body)
}
export async function destroy(tableName, id) {
  const { app, key } = this ? this.config : config()
  const body = await fetch(app + tableName + '/' + id, {
    method: 'DELETE',
    headers: {
      Authorization: 'Bearer ' + key,
      Accept: 'application/json',
      'Content-Type': 'application/json'
    }
  }).then(r => r.json())
  return unpack(body)
}
// Helpers
export function pack(fields) {
  return {
    id: fields._id,
    fields: Object.assign(fields, { _id: null, createdTime: null }),
    createdTime: fields.createdTime
  }
}
export function unpack({ id: _id, fields, createdTime }) {
  return Object.assign(
    {
      _id,
      createdTime
    },
    fields
  )
}
function serialize(obj) {
  const str = []
  for (const p in obj) {
    if (obj.hasOwnProperty(p) && obj[p]) {
      str.push(encodeURIComponent(p) + '=' + encodeURIComponent(obj[p]))
    }
  }
  return str.join('&')
}
function unserialize(str) {
  const query = str[0] === '#' || str[0] === '?' ? str.slice(1) : str
  const result = {}
  query.split('&').forEach(part => {
    const item = part.split('=')
    result[decodeURIComponent(item[0])] = decodeURIComponent(item[1])
  })
  return result
}
// Filters
export function recordFilter(field, id) {
  return {
    filterByFormula: 'RECORD_ID()=' + id
  }
}
export function byIds(ids) {
  return {
    filterByFormula: "OR(RECORD_ID()='" + ids.join("',RECORD_ID()='") + "')"
  }
}
export function where(field, value) {
  return {
    filterByFormula: '{' + field + "}='" + value + "'"
  }
}
