import { google } from 'googleapis'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/presentations.readonly',
  'https://www.googleapis.com/auth/spreadsheets',
]

let cachedAuth: ReturnType<typeof buildAuth> | null = null

function buildAuth() {
  const credPath = process.env.GOOGLE_CREDENTIALS_PATH
  if (!credPath) throw new Error('GOOGLE_CREDENTIALS_PATH env is not set')
  const absPath = resolve(process.cwd(), credPath)
  const keyFile = JSON.parse(readFileSync(absPath, 'utf-8'))
  return new google.auth.GoogleAuth({
    credentials: keyFile,
    scopes: SCOPES,
  })
}

export function getAuth() {
  if (!cachedAuth) cachedAuth = buildAuth()
  return cachedAuth
}

export function getDrive() {
  return google.drive({ version: 'v3', auth: getAuth() })
}

export function getSlides() {
  return google.slides({ version: 'v1', auth: getAuth() })
}

export function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}
