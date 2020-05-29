import { readFile, writeFile } from 'fs'
import { promisify } from 'util'
import { resolve } from 'path'
const readFileP = promisify(readFile)
const writeFileP = promisify(writeFile)

const _contributionTypes = {
  audio: 'Audio/Podcasts - background music or sound effects',
  a11y: 'Accessibility/Reporting -  or working on accessibility issues',
  bug: 'Bug Reports - links to issues reported by the user on this project',
  blog: 'Blogposts - links to the blogpost',
  business: 'Business Development - people who execute on the business end',
  code: 'Code links  -to commits by the user on this project',
  content: 'Content - e.g. website copy, blog posts are separate',
  data: 'Data - links to contributed data for the project (both tests and datasets)',
  doc: 'Documentation - links to commits by the user on this project, Wiki, or other source of documentation',
  design: 'Design - links to the logo/iconography/visual design/etc.',
  example: 'Examples - links to the examples',
  eventOrganizing: 'Event Organizers - links to event page',
  financial: 'Financial Support - people or orgs who provide financial support, links to relevant page',
  ideas: 'Ideas & Planning',
  infra: 'Infrastructure Hosting, Build-Tools, etc - Links to source file (like travis.yml) in repo, if applicable',
  maintenance: 'Maintenance - people who help in maintaining the repo, links to commits by the user on this project',
  platform: 'Packaging - porting to support a new platform',
  plugin: 'Plugin/utility - libraries links to the repo home',
  projectManagement: 'Project Management',
  question: 'Answering Questions - Answering Questions in Issues, Stack Overflow, Gitter, Slack, etc.',
  review: 'Reviewed - Pull Requests ',
  security: 'Security - identify and/or reduce security threats, GDPR, Privacy, etc',
  tool: 'Tools - links to the repo home',
  translation: 'Translation - links to the translated content',
  test: 'Tests - links to commits by the user on this project',
  tutorial: 'Tutorials - links to the tutorial',
  talk: 'Talks - links to the slides/recording/repo/etc',
  userTesting: 'User - Testing links to user test notes',
  video: 'Videos - links to the video'
}

;(async () => {
  const path = resolve('', '.all-contributorsrc')
  const file = await readFileP(path)
  const contribCfg = JSON.parse(file.toString())

  if (contribCfg._contributionTypes) {
    const { _contributionTypes } = contribCfg
    console.log({ _contributionTypes })
  } else {
    console.log('adding types')
    await writeFileP('.all-contributorsrc', JSON.stringify({ ...contribCfg, _contributionTypes }, null, 2))
    console.log({ _contributionTypes })
  }
})()
