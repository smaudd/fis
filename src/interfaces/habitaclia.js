import puppeteer from 'puppeteer'
import Department from 'models/Department.model'
import cheerio from 'cheerio'
import chromeOptions from '../../browserConfig'
import fs from 'fs'
import path from 'path'
const url = 'https://www.habitaclia.com/alquiler-poble_sec-barcelona.htm?filtro_periodo=3&hab=2&pmin=800&pmax=1100&codzonas=301&coddists=300'

const getHTML = async () => {
    const browser = await puppeteer.launch({ ...chromeOptions, executablePath: process.env.CHROME_EXECUTABLE_PATH })
    const page = await browser.newPage()
    await page.goto(url)
    await page.waitFor(1000)
    const content = await page.content()
    fs.writeFileSync(path.resolve(__dirname, '../assets/habitaclia.html'), content)
    await browser.close()
    return content
}

const scrapeHTML = (html) => {
    const $ = cheerio.load(html)
    const items = $('.js-list-item.list-item-container')
    const results = []
    items.each((_, e) => {
        const price = $(e).find('span.font-2').text()
        let intPrice = parseFloat(price)
        if (intPrice < 5) {
            intPrice = intPrice * 1000
        }
        if (intPrice > 1000) return
        const item = {
            reference: $(e).attr('id'),
            image: $(e).find('.list-gallery-image').attr('data-image'),
            link: $(e).find('h3 > a').attr('href'),
            price: $(e).find('span.font-2').text(),
            title: $(e).find('h3 > a').attr('title'),
            contact: $(e).find('.icon-phone.item-not-clickable-phone').text(),
            description: $(e).find('p.list-item-description').text()
        }
        results.push(item)
    })
    return results

}

const habitaclia = async () => {
    const html = await getHTML()
    if (!html) return html
    const results = scrapeHTML(html)
    results.forEach(async (result) => {
        const department = await Department.findOneAndUpdate(
            { reference: result.reference },
            result,
            { new: true, upsert: true }
        )
    })
    return null
}

export default habitaclia

