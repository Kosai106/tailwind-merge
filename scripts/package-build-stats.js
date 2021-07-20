import { dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

import packageBuildStats from 'package-build-stats'

const { getPackageStats } = packageBuildStats
const dirPath = dirname(fileURLToPath(import.meta.url))
const pakcagePath = `${dirPath}/..`
const readmePath = `${dirPath}/../README.md`

const [packageStats, readme] = await Promise.all([
    getPackageStats(pakcagePath),
    fs.promises.readFile(readmePath, { encoding: 'utf-8' }),
])

const gzipSize = `${(packageStats.gzip / 1024).toFixed(1)} kB`
const totalCompositionSize = packageStats.dependencySizes.reduce(
    (sum, current) => sum + current.approximateSize,
    0
)
const composition = packageStats.dependencySizes
    .map((dependency) => {
        const name = dependency.name === 'tailwind-merge' ? 'self' : dependency.name
        const percentageSize = (100 * dependency.approximateSize) / totalCompositionSize

        return `${percentageSize.toFixed(1)}% ${name}`
    })
    .join(', ')

console.log(`Package stats: Total ${gzipSize} kB minified + gzipped, ${composition}`)

const nextReadme = readme
    .replace(
        /(?<commentStart><!-- AUTOGENERATED START package-build-stats:gzipSize -->).+?(?<commentEnd><!-- AUTOGENERATED END -->)/,
        `$<commentStart>${gzipSize}$<commentEnd>`
    )
    .replace(
        /(?<commentStart><!-- AUTOGENERATED START package-build-stats:composition -->).+?(?<commentEnd><!-- AUTOGENERATED END -->)/,
        `$<commentStart>${composition}$<commentEnd>`
    )

if (nextReadme !== readme) {
    await fs.promises.writeFile(readmePath, nextReadme)
}
