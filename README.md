# Sapper-airtable

Using airtable data in sapper project.

# Usage

- Add your app key and api key to `.env`
- Add table names to `store.js`
- Create, Read, Update and Delete items in `index.html`
  - Create: `items.create({name: 'name'})`
  - Read: `{item.name}`
  - Update: `items.update(item._id, {name: 'newName'})`
  - Delete: `items.destroy(item._id)`
