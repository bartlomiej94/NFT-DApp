import axios from 'axios'
import crypto from 'crypto'

const getRandomCallId = () => {
    return parseInt(Math.random() * 10 ** 12).toString()
}

const encrypt = (message) => {
    const algorithm = 'aes-256-ctr'
    const secretKey = 'secret-key';
    message += secretKey
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(algorithm, secretKey, iv)
    const encrypted = Buffer.concat([cipher.update(message), cipher.final()]);
    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
}

const getHeaders = (message) => {
    return {
        'Content-Type': 'application/json',
        'Authorization': JSON.stringify(encrypt(message))
    }
}

export const getYesterdayPrices = async () => {
    const random = getRandomCallId()
    const headers = getHeaders(random)
    try {
        const response = await axios.post(`/.netlify/functions/getYesterdayPrices`, { callId: random }, { headers })
        return response.data
    } catch (error) {
        console.error(error)
    }
}

export const setYesterdayPrice = async (id, data) => {
    const random = getRandomCallId()
    const headers = getHeaders(random)
    try {
        axios.post('/.netlify/functions/setYesterdayPrices', { data, id, callId: random }, { headers })
    } catch (error) {
        console.error(error)
    }
}

export const pushToRedeemed = async (data) => {
    const random = getRandomCallId()
    const headers = getHeaders(random)
    try {
        axios.post('/.netlify/functions/pushToRedeem', { data, callId: random }, { headers })
    } catch (error) {
        console.error(error)
    }
}

export const updateBurnedByHash = async (txHash) => {
    const random = getRandomCallId()
    const headers = getHeaders(random)
    try {
        axios.post('/.netlify/functions/updateBurnedByHash', { txHash, callId: random}, { headers })
    } catch (error) {
        console.error(error)
    }
}