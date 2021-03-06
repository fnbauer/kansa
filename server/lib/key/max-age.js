const config = require('@kansa/common/config')

module.exports = function getKeyMaxAge(db, email) {
  return db
    .one(`SELECT exists(SELECT 1 FROM admin.admins WHERE email = $1)`, email)
    .then(({ exists }) => {
      const type = exists ? 'admin' : 'normal'
      return config.auth.key_timeout[type] / 1000
    })
}
