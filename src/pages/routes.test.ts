import fs from 'fs'
import { parseStringPromise } from 'xml2js'

import { routes } from './RouteDefinitions'

describe('Routes', () => {
  it('sitemap URLs should exist as Router paths', async () => {
    const pathNames: string[] = routes.map((routeDef) => routeDef.path)
    await new Promise<boolean>((resolve, reject) => {
      try {
        fs.readFile('./public/sitemap.xml', 'utf8', async (err, data) => {
          if (err) {
            reject(err)
          }
          const sitemap = await parseStringPromise(data)

          const sitemapPaths = sitemap.urlset.url.map((url: any) => new URL(url['$'].loc).pathname)

          sitemapPaths.forEach((path: string) => {
            expect(pathNames).toContain(path)
            if (!pathNames.includes(path)) {
              throw new Error(`${path} is missing from Routes`)
            }
          })

          resolve(true)
        })
      } catch (err) {
        reject(err)
      }
    })
  })

  /**
   * If you are updating the app routes, consider if you need to make a
   * corresponding update to the sitemap.xml file.
   */
  it('router definition should match snapshot', () => {
    expect(routes).toMatchSnapshot()
  })
})
