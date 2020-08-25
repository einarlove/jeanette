import fetch from 'node-fetch'
import FormData from 'form-data'
import formUrlencoded from 'form-urlencoded'

const {
  POWEROFFCE_API_URL,
  POWEROFFICE_APP_KEY,
  POWEROFFICE_APP_SECRET,
} = process.env

async function getAccessToken() {
  const { access_token } = await (
    await fetch(POWEROFFCE_API_URL + '/OAuth/Token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${Buffer.from(
          [POWEROFFICE_APP_KEY, POWEROFFICE_APP_SECRET].join(':')
        ).toString('base64')}`,
      },
      body: formUrlencoded({
        grant_type: 'client_credentials',
      }),
    })
  ).json()

  return access_token
}

export default async function powerOfficeRequest<T extends object>(
  path: string,
  query?: { [key: string]: string }
) {
  const accessToken = await getAccessToken()

  const json = await (
    await fetch(
      POWEROFFCE_API_URL +
        (query ? '/' + path + '?' + new URLSearchParams(query) : ''),
      {
        headers: {
          Accept: 'application/json',
          Authorization: 'Bearer ' + accessToken,
        },
      }
    )
  ).json()

  return json.data as T
}
