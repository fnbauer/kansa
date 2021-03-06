const archiver = require('archiver')
const fs = require('fs')
const path = require('path')
const { matchesId } = require('@kansa/common/auth-user')

class Queries {
  constructor(db) {
    this.db = db
    this.upsertArtist = this.upsertArtist.bind(this)
    this.getArtist = this.getArtist.bind(this)
    this.getWork = this.getWork.bind(this)
    this.getWorks = this.getWorks.bind(this)
    this.createWork = this.createWork.bind(this)
    this.updateWork = this.updateWork.bind(this)
    this.removeWork = this.removeWork.bind(this)
    this.exportArtists = this.exportArtists.bind(this)
    this.exportPreview = this.exportPreview.bind(this)
    this.exportWorks = this.exportWorks.bind(this)
  }

  access(req) {
    return matchesId(this.db, req, 'raami_admin')
  }

  getArtist(req, res, next) {
    this.access(req)
      .then(id =>
        this.db.oneOrNone(`SELECT * FROM Artist WHERE people_id = $1`, id)
      )
      .then(data => res.json(data || {}))
      .catch(next)
  }

  upsertArtist(req, res, next) {
    this.access(req)
      .then(id => {
        const artist = Object.assign({}, req.body, { people_id: id })
        const keys = [
          'people_id',
          'name',
          'continent',
          'url',
          'filename',
          'filedata',
          'category',
          'description',
          'transport',
          'auction',
          'print',
          'digital',
          'legal',
          'agent',
          'contact',
          'waitlist',
          'postage',
          'half'
        ].filter(key => artist.hasOwnProperty(key))
        const insertValues = keys.map(key => `$(${key})`).join(', ')
        const insertArtist = `(${keys.join(', ')}) VALUES(${insertValues})`
        const updateArtist = keys.map(key => `${key}=$(${key})`).join(', ')
        return this.db.one(
          `
        INSERT INTO Artist ${insertArtist}
        ON CONFLICT (people_id)
          DO UPDATE SET ${updateArtist}
          RETURNING people_id`,
          artist
        )
      })
      .then(people_id => res.json({ status: 'success', people_id }))
      .catch(next)
  }

  /**** WORKS ***/

  getWorks(req, res, next) {
    this.access(req)
      .then(id => this.db.any(`SELECT * FROM Works WHERE people_id=$1`, id))
      .then(data => res.json(data))
      .catch(next)
  }

  getWork(req, res, next) {
    this.access(req)
      .then(id => {
        const params = Object.assign({}, req.params, { people_id: id })
        this.db.one(
          `SELECT * FROM Works WHERE id=$(work) AND people_id=$(people_id)`,
          params
        )
      })
      .then(data => res.json(data))
      .catch(next)
  }

  createWork(req, res, next) {
    this.access(req)
      .then(id => {
        const work = Object.assign({}, req.body, { people_id: id })
        const keys = [
          'people_id',
          'title',
          'width',
          'height',
          'depth',
          'gallery',
          'original',
          'orientation',
          'technique',
          'filename',
          'filedata',
          'year',
          'price',
          'start',
          'sale',
          'copies',
          'form',
          'permission'
        ].filter(key => work.hasOwnProperty(key))
        const insertValues = keys.map(key => `$(${key})`).join(', ')
        return this.db.one(
          `
        INSERT INTO Works
                    (${keys.join(', ')})
             VALUES (${insertValues})
          RETURNING id`,
          work
        )
      })
      .then(({ id }) => res.json({ status: 'success', inserted: id }))
      .catch(next)
  }

  updateWork(req, res, next) {
    this.access(req)
      .then(id => {
        const work = Object.assign({}, req.body, {
          people_id: id,
          work: req.params.work
        })
        const keys = [
          'people_id',
          'title',
          'width',
          'height',
          'depth',
          'gallery',
          'original',
          'orientation',
          'technique',
          'filename',
          'filedata',
          'year',
          'price',
          'start',
          'sale',
          'copies',
          'form',
          'permission'
        ].filter(key => work.hasOwnProperty(key))
        const updateWork = keys.map(key => `${key}=$(${key})`).join(', ')
        return this.db.none(
          `
        UPDATE Works
           SET ${updateWork}
         WHERE id=$(work) AND people_id=$(people_id)`,
          work
        )
      })
      .then(() => res.json({ status: 'success' }))
      .catch(next)
  }

  removeWork(req, res, next) {
    this.access(req)
      .then(id =>
        this.db.result(
          `
      DELETE FROM Works
       WHERE id=$(work) AND people_id=$(people_id)`,
          { people_id: id, work: req.params.work }
        )
      )
      .then(() => res.json({ status: 'success' }))
      .catch(next)
  }

  /**** exports ****/

  exportArtists(req, res, next) {
    this.db
      .any(
        `
    SELECT p.member_number, p.membership, p.legal_name, p.email, p.city, p.country,
        a.name, a.continent, a.url,
        a.category, a.description, a.transport, a.auction, a.print, a.digital, a.half,
        a.legal, a.agent, a.contact, a.waitlist, a.postage
        FROM Artist as a, kansa.people as p WHERE a.people_id = p.ID order by p.member_number
    `
      )
      .then(data => res.csv(data, true))
      .catch(next)
  }

  exportPreview(req, res, next) {
    //const dir = '/tmp/raamitmp/'
    const output = fs.createWriteStream('/tmp/raamipreview.zip')
    const zip = archiver('zip', { store: true })
    output.on('close', () => {
      console.log(zip.pointer() + ' total bytes')
      fs.stat('/tmp/raamipreview.zip', (err, stats) => {
        if (err) return next(err)
        console.log(stats)
      })
      res.sendFile(path.resolve('/tmp/raamipreview.zip'))
    })
    zip.on('error', next)
    this.db
      .any(
        `
		SELECT w.filedata, w.filename, a.name
		  FROM Works w LEFT JOIN Artist a USING (people_id)
		 WHERE w.filedata IS NOT NULL`
      )
      .then(data => {
        zip.pipe(output)
        for (img of data) {
          const imgdata = img.filedata.match(
            /^data:([A-Za-z-+\/]*);base64,(.+)$/
          )
          if (imgdata) {
            const buffer3 = new Buffer.from(imgdata[2], 'base64')
            zip.append(buffer3, { name: img.name + '_' + img.filename })
          }
          // fs.writeFile(dir+img.name+'_'+img.filename, img.filedata, (err)=>{
          //     if (err) throw err
          // })
          // console.log(dir+img.name+'_'+img.filename+' saved')
        }
        //archive.directory(dir);
        zip.finalize()
      })
      .catch(next)
  }

  exportWorks(req, res, next) {
    this.db
      .any(
        `
    SELECT a.name, a.people_id AS artist_id, w.id AS work_id,
           w.title, w.width, w.height, w.depth, w.technique, w.orientation,
           w.graduation, w.filename, w.price, w.gallery, w.year, w.original,
           w.copies, w.start, w.sale, w.permission, w.form
      FROM Works w LEFT JOIN Artist a USING (people_id)`
      )
      .then(data => res.csv(data, true))
      .catch(next)
  }
}

module.exports = Queries
