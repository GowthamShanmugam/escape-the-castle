#!/usr/bin/env node
import puppeteer from 'puppeteer'
import { existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const publicDir = join(__dirname, '../public')
const htmlPath = 'file://' + join(publicDir, 'arcade-banner-source.html')

// Prefer system Chrome to avoid puppeteer's browser download
const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  process.env.PUPPETEER_EXECUTABLE_PATH,
].filter(Boolean)
const executablePath = chromePaths.find((p) => p && existsSync(p))

try {
  const browser = await puppeteer.launch({
    headless: 'new',
    ...(executablePath && { executablePath }),
  })
  const page = await browser.newPage()
  await page.setViewport({ width: 480, height: 270, deviceScaleFactor: 2 })
  await page.goto(htmlPath, { waitUntil: 'networkidle0' })
  await page.screenshot({ path: join(publicDir, 'arcade-banner.jpg'), type: 'jpeg', quality: 95 })
  await page.screenshot({ path: join(publicDir, 'arcade-banner.png'), type: 'png' })
  await browser.close()
  console.log('Generated: arcade-banner.jpg, arcade-banner.png')
} catch (err) {
  if (err.message?.includes('Could not find Chrome')) {
    console.error('Chrome not found. Either install Google Chrome, or run:')
    console.error('  npx puppeteer browsers install chrome')
    process.exit(1)
  }
  throw err
}
