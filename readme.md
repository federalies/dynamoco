<!-- PROJECT SHIELDS -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
[![All Contributors](https://img.shields.io/badge/all_contributors-0-orange.svg?style=flat-square)](#contributors-)
<!-- ALL-CONTRIBUTORS-BADGE:END -->
<!--
*** I'm using markdown "reference style" links for readability.
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![LinkedIn][linkedin-shield]][linkedin-url]
[![Contributors][contributors-shield]][contributors-url]
-->

[![NPM Version][npm-version-shield]][npm-version-url]
[![Pkg Size][size-shield]][size-url]
[![Code Coverage][coveralls-sheild]][coveralls-url]
[![MIT License][license-shield]][license-url]

[![Github Activity][gh-commit-activity-shield]][gh-commit-activity-url]
[![Issues Closed ][github-issues-closed-shield]][github-issues-closed-url]
[![Issues][issues-shield]][issues-url]

<!-- [![Built By][ftb-by-devs-shield]][federalies-url] -->
<!-- [![Winter Is Coming][ftb-winter-shield]][ftb-winter-url] -->
<!-- [![Built With][ftb-builtWith-shield]][federalies-url] -->

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/federalies/dynamoco/wiki/Documentation">
    <img src="https://raw.githubusercontent.com/federalies/dynamoco/master/images/DynamocoLogo.png" 
         alt="Logo" width="300" height="300"/>
  </a>

  <h3 align="center">Dynamoco + Mocoquery</h3>

  <p align="center">
    Like a Carebear giving DynamoDB a hug
    <br />
    <br />
    <a href="https://github.com/federalies/dynamoco/wiki/Documentation">
        <strong> Project Documentation » </strong>
    </a>
    <br />
    <br />
    <a href="https://federalies.github.io/dynamoco/">
        <strong> API Documentation » </strong>
    </a>
    <br />
    <br />
        <a href="https://github.com/federalies/dynamoco/issues">
        Report Bug
        </a>
    <br />
    <br />
        <a href="https://github.com/federalies/dynamoco/issues">
        Request Feature
        </a>
  </p>
</p>


Dynamoco + Mocoquery
====================

<!-- ABOUT THE PROJECT -->

<!-- 
Screen Shot Example
[![Product Name Screen Shot][product-screenshot]](https://github.com/federalies/dynamoco)
-->

[![Github Action - Node Integration Build/Test][github-action-(build/test)-shield]][github-action-(build/test)-url]

## Overview

DynamoDB is a datastore that allows you to not manage as many details as a regular database. You just give it data; it faithfully holds it, and pretty quickly gives it back to you when you ask for it. Sound geat, right?!?! It's almost great. DynamoDB is a solid product from AWS, but the way you interact with it feels like shoving your finger in your eye.

Enter: Dynamoco! 

A small but mighty, wrapper that is strong enough to get what you want out of DynamoDB, and it's gentle enough to help you feel like you are bowling with bumpers up. #NoGutters

Writeen in Typescript, it helps you auto-complete your way to valid queries, and other ways to pull your data out.  It also helps you with type-check compiling and all that jazz if you are into that. If not its super easy to add it as regular ol' javascript yall.

### The Dynamoco Problem 

1. The API of DynamoDB has a steep learning curve.
2. The flexibiltiy in the DynamoDB Client creates too much complexity to comprehend when you are just getting started.
3. Dynamoco optimizes for a few normative use-cases, and it makes those very easy.
4. If you need to do the more complicated parts, it attempts to move out of the way.

### The Dynamoco Solution 

Use this package if:

- You need to just get going with DynamoDB
- You find the DynamoDB API difficult or at least optimzed for AWS engineers and not you.
- Streamlined and flexible modules are your kind of your thing.

- its like getting `dynamo-converter`, and `dynamo-client` and `dynamo-plus` all for the price of one.

<!-- GETTING STARTED -->

### Installation

```sh
npm install @federalies/dynamoco
# or
yarn add @federalies/dynamoco
```

<!-- USAGE EXAMPLES -->
## Usage

First, know that this package is the ultimate BOGO or Two-For-One. Yes friends,there are in fact two, count them, two independent functions that work nicely together in the `dynamoco` module. Both come tested and documented free to you. What a time to be alive!

The first function is the gentle wrapper and the module namesake. (`dynamoco`)

But wait there's more, for free, you get a second and not to be overlooked, incredibly pleasant query builder - `mocoquery`

Together this dynamic duo cover ground on the API exposed by DynamoDB.

### Using Get Item 

```js
import {DynamoDB} from 'aws-sdk'
import {dynamoco} from '@federalies/dynamoco'  // yay for tree-shaking
import {credentials} from './credentials'

;(async ()=>{
    const d = new DynamoDB({credentials})
    const moco = dynamoco(d)
    // using a table that is already available
    const resutls = await moco.getItem('MyTable', {MyKey: 'SomeValue'})
    console.log(results._Item) 
        /* {    
                MyKey: 'SomeValue', 
                numberValues: 1,
                stringValues: 'strings are strings'
            } 
        */
})()
```

### Using The MocoQuery Builder

```js
import {DynamoDB} from 'aws-sdk'
import {mocoquery, dynamoco} from '@federalies/dynamoco'
import {credentials} from './credentials'

;(async ()=>{
    const d = new DynamoDB({credentials})
    const queryParams = mocoquery('MyTable')
                        .select('*')
                        .where(['Year','<=',2020])
                        .extract()

    // using the regular DynamoDB Client 
    const regularResults = await d.query(queryParams)
    console.log('regularResults', regularResults.Items)
    
    // using the regular DynamoDB Client 
    const ezResults = await dynamoco(d).query(queryParams)
    console.log('ezResults', ezResults._Items)
})()
```

_For more examples, please refer to the [Documentation](https://github.com/federalies/dynamoco/wiki/Documentation)_


## Technical

### Single dependency

By design, this module has a single, external, run-time dependency (`aws-sdk`). It uses a few other packages with tests, and some built-in modules to node. 
It is a stated goal of the project to keep the dependencies as small as reasonable. _(NOTE: that is not equivalent to "as small as possible")_

#### Dependencies

* [aws-sdk](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html)

### Codebase

This is a Typescript codebase, and aims to be relatively up to date with the latest version. Adopting typescript versions updates will likely comence after a version hardening period in the wild, but might be hastened if a new language feature has been added that substantially supports this project.

<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/federalies/dynamoco/issues) for a list of proposed features (and known issues).

## Community

Coming soon: 

- Community Chat
- Stack Overflow hashtags
- And Other Supporting Documentation

<!--
- Slack
- Riot
- Spectrum 
-->

See the [Community Standards and Code of Conduct](./CODE_OF_CONDUCT.md)

<!-- CONTACT -->
## Contact

Eric D Moore

 - [Email](mailto:dynaMoco@filters.email)
 - [Twitter](https://twitter.com/ericdmoore)
 - [Website](https://ericdmoore.com)
 - [Federalies](https://federali.es)

<!-- CONTRIBUTING -->
## Contributing

Have a question? Ask your question inside an issue! 
We'd love to hear from you.

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Contributors
Made with :heart: by [@ericdmoore](https://github.com/ericdmoore) and maybe you?

_[use the emoji legend](https://github.com/kentcdodds/all-contributors#emoji-key)_
<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://im.ericdmoore.com"><img src="https://avatars0.githubusercontent.com/u/25398118?v=4" width="100px;" alt=""/><br /><sub><b>Eric D Moore</b></sub></a><br /><a href="#question-ericdmoore" title="Answering Questions">💬</a> <a href="#tutorial-ericdmoore" title="Tutorials">✅</a> <a href="https://github.com/federalies/dynamoco/commits?author=ericdmoore" title="Documentation">📖</a> <a href="https://github.com/federalies/dynamoco/commits?author=ericdmoore" title="Code">💻</a> <a href="https://github.com/federalies/dynamoco/commits?author=ericdmoore" title="Tests">⚠️</a> <a href="#design-ericdmoore" title="Design">🎨</a> <a href="#example-ericdmoore" title="Examples">💡</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!


<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements & Credits

- Care Bear Picture Logo
- [standard-readme](https://github.com/RichardLitt/standard-readme)


<!-- LICENSE -->
## License

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[federalies-url]:https://github.com/federalies

[contributors-shield]: https://img.shields.io/github/contributors/federalies/dynamoco?style=for-the-badge
[contributors-url]: https://github.com/federalies/dynamoco/graphs/contributors

[forks-shield]: https://img.shields.io/github/forks/federalies/dynamoco?style=for-the-badge
[forks-url]: https://github.com/federalies/dynamoco/network/members

[size-shield]: https://img.shields.io/bundlephobia/minzip/@federalies/dynamoco?style=for-the-badge
[size-url]: https://bundlephobia.com/result?p=@federalies/dynamoco

[stars-shield]: https://img.shields.io/github/stars/federalies/dynamoco?style=for-the-badge
[stars-url]: https://github.com/federalies/dynamoco/stargazers

[issues-shield]: https://img.shields.io/github/issues/federalies/dynamoco?style=for-the-badge
[issues-url]: https://github.com/federalies/dynamoco/issues

[license-shield]: https://img.shields.io/github/license/federalies/dynamoco?style=for-the-badge
[license-url]: https://github.com/federalies/dynamoco/blob/master/LICENSE

[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=for-the-badge&logo=linkedin&colorB=555

[linkedin-url]: https://linkedin.com/in/eric.moore
[product-screenshot]: images/screenshot.png

[ftb-winter-shield]: https://forthebadge.com/images/badges/winter-is-coming.svg
[ftb-winter-url]: https://github.com/federalies/dynamoco/wiki#winter-is-coming

[ftb-builtwith-shield]: https://forthebadge.com/images/badges/built-with-love.svg
[ftb-by-devs-shield]: https://forthebadge.com/images/badges/built-by-developers.svg

[coveralls-sheild]:https://img.shields.io/coveralls/github/federalies/dynamoco?style=for-the-badge
[coveralls-url]:https://coveralls.io/github/federalies/dynamoco

[npm-version-url]:https://img.shields.io/npm/v/@federalies/dynamoco?style=for-the-badge
[npm-version-shield]:https://img.shields.io/npm/v/@federalies/dynamoco?style=for-the-badge

[github-action-(build/test)-url]:https://github.com/federalies/dynamoco/actions?query=workflow%3A%22Build+%26+Tests%22
[github-action-(build/test)-shield]:https://github.com/federalies/dynamoco/workflows/Build%20&%20Tests/badge.svg

[github-issues-closed-url]:https://github.com/federalies/dynamoco/issues?q=is%3Aissue+is%3Aclosed+
[github-issues-closed-shield]:https://img.shields.io/github/issues-closed-raw/federalies/dynamoco?style=for-the-badge

[gh-commit-activity-url]:https://github.com/federalies/dynamoco/pulse/monthly
[gh-commit-activity-shield]:https://img.shields.io/github/commit-activity/m/federalies/dynamoco?style=for-the-badge
