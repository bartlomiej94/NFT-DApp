const faunadb = require('faunadb')
const crypto = require('crypto')

const client = new faunadb.Client({
  domain: 'db.us.fauna.com',
  secret: process.env.FAUNADB_SERVER_SECRET
});

const q = faunadb.query;

function validateAuth(authArr, callId) {
    if (!authArr) return false

    const algorithm = 'aes-256-ctr'
    const secretKey = process.env.AUTH_TOKEN;
    const auth = authArr.filter(elem => {
        const parsed = JSON.parse(elem)

        for (const key in parsed) {
            if (key === 'iv') {
                return parsed
            }
        }
    })

    const hash = JSON.parse(auth[0])

    if (!hash) {
        return false
    }

    const decipher = crypto.createDecipheriv(algorithm, secretKey, Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    if (decrypted.toString() !== callId + secretKey) {
        return false
    }

    return true
}


exports.handler = async function (query) {
    const params = JSON.parse(query.body)
    const { callId } = params

    const validated = validateAuth(query.multiValueHeaders['Authorization'] || query.multiValueHeaders['authorization'], callId)

    const { referer } = query.headers
    const { httpMethod } = query
    
    if (httpMethod !== 'POST' || !referer || referer !== process.env.REFERER || !validated) {
        return {
            statusCode: 401
        }
    }

    try {
        const response = await client.query(
            q.Map(
                q.Paginate(q.Match(q.Index('all_yesterday_prices'))),
                q.Lambda(x => q.Get(x))
              )
        )

        return {
            statusCode: 200,
            body: JSON.stringify(response.data)
        }
    } catch (err) {
        console.error(err)
        return {
            statusCode: 500
        }
    }
}