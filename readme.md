
<!-- PROJECT SHIELDS -->
<!--
*** I'm using markdown "reference style" links for readability.
*** Reference links are enclosed in brackets [ ] instead of parentheses ( ).
*** See the bottom of this document for the declaration of the reference variables
*** for contributors-url, forks-url, etc. This is an optional, concise syntax you may use.
*** https://www.markdownguide.org/basic-syntax/#reference-style-links
-->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![MIT License][license-shield]][license-url]
[![LinkedIn][linkedin-shield]][linkedin-url]

<!-- PROJECT LOGO -->
<br />
<p align="center">
  <a href="https://github.com/othneildrew/Best-README-Template">
    <img src="images/DynamocoLogo.png" alt="Logo" width="256" height="256"/>
  </a>

  <h3 align="center">DynaMoco + MocoQuery</h3>

  <p align="center">
    Like a Carebear giving a little hug to how you might handle DyanmoDB.
    <br />
    <br />
    <a href="https://github.com/othneildrew/Best-README-Template">
        <strong>Documnetation »</strong>
    </a>
    <br />
    <br />
        <a href="https://github.com/othneildrew/Best-README-Template">
        Codepen Demo
        </a>
    <br />
    <br />
        <a href="https://github.com/othneildrew/Best-README-Template/issues">
        Report Bug
        </a>
    <br />
    <br />
        <a href="https://github.com/othneildrew/Best-README-Template/issues">
        Request Feature
        </a>
  </p>
</p>


DyanMoCo & MoCoQuery
====================

<!-- ABOUT THE PROJECT -->

[![Product Name Screen Shot][product-screenshot]](https://example.com)

DynamoDB is great but the way you interact with it is not really great. DynaMoco is small but mighty, wrapper that is strong enough to get what you want out of DynamoDB and gentle enough to act like bowling with bumpers on.

Writeen in Typescript it should help you with auto-complete etc - if that is of interest.

### The DynaMoco Problem 

1. The API of Dyanmo has a steep learning curve.
2. Its flexibiltiy creates too much complexity to comprehend at thge outset.
3. Dynamoco optimizes for a few use-cases that seem noramtive, making those very easy.
4. If you need to do the more complicated parts, it attempts to move out of the way.

### The DynaMoco Solution 

Use this package if:
- you find the Ayanmo API optimzied for AWS and not users.
- you dont like adding bloated packages to your project.

A list of commonly used resources that I find helpful are listed in the acknowledgements.

### Single dependency

By design, this module has a single, external, run-time dependency (`aws-sdk`). And it uses a few other packages while running tests.

* [aws-sdk](https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html)

<!-- GETTING STARTED -->
## Getting Started

This is an example of how you may give instructions on setting up your project locally.
To get a local copy up and running follow these simple example steps.

### Installation

```sh
npm install dynamoco
# or
yarn add dynamoco
```

<!-- USAGE EXAMPLES -->
## Usage

There are two independent functions that work nicely together in `dynamoco`.

The first is the gentle wrapper - `dynamoco`

The second is a nice query builder - `mocoquery`

Each of them cover some ground on the API surface area exposed by Dyanmo.



### Full Monty - Get Item

```js
import {Dynamo} from 'aws-sdk'
import {dynamoco} from 'dynamoco'
import {credentials} from './credentials'

;(async ()=>{
    const d = new Dyanmo({credentials})
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


### Wrinkles Ironed Out

```js
import {Dynamo} from 'aws-sdk'
import {mocoquery} from 'dynamoco'
import {credentials} from './credentials'

;(async ()=>{
    const d = new Dyanmo({credentials})
    const queryParams = mocoquery('MyTable')
                        .select('*')
                        .where(['Year','>=',2020])
                        .extract()
    // using the regular Dyanmo Client 
    const regularResults = await d.query(queryParams)
    console.log('regularResults', regularResults.Items)
    
    // using the regular Dyanmo Client 
    const ezResults = await dynamoco(d).query(queryParams)
    console.log('ezResults', ezResults._Items)
})()
```


_For more examples, please refer to the [Documentation](https://example.com)_


<!-- ROADMAP -->
## Roadmap

See the [open issues](https://github.com/othneildrew/Best-README-Template/issues) for a list of proposed features (and known issues).


<!-- CONTRIBUTING -->
## Contributing

Contributions are what make the open source community such an amazing place to be learn, inspire, and create. Any contributions you make are **greatly appreciated**.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


## Community


<!-- CONTACT -->
## Contact

Eric D Moore

 - [Email](mailto:dynaMoco@filters.email)
 - [Twitter](https://twitter.com/ericdmoore)
 - [Website](https://ericdmoore.com)
 - [Federalies](https://federali.es)


Project Link: [https://github.com/federalies/dynamoco](https://github.com/federalies/dynamoco)



<!-- ACKNOWLEDGEMENTS -->
## Acknowledgements & Credits
* [GitHub Emoji Cheat Sheet](https://www.webpagefx.com/tools/emoji-cheat-sheet)
* [Img Shields](https://shields.io)
* [Choose an Open Source License](https://choosealicense.com)
* [GitHub Pages](https://pages.github.com)
* [Animate.css](https://daneden.github.io/animate.css)
* [Loaders.css](https://connoratherton.com/loaders)
* [Slick Carousel](https://kenwheeler.github.io/slick)
* [Smooth Scroll](https://github.com/cferdinandi/smooth-scroll)
* [Sticky Kit](http://leafo.net/sticky-kit)
* [JVectorMap](http://jvectormap.com)
* [Font Awesome](https://fontawesome.com)
* https://github.com/RichardLitt/standard-readme

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[contributors-shield]: https://img.shields.io/github/contributors/othneildrew/Best-README-Template.svg?style=flat-square
[contributors-url]: https://github.com/othneildrew/Best-README-Template/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/othneildrew/Best-README-Template.svg?style=flat-square
[forks-url]: https://github.com/othneildrew/Best-README-Template/network/members
[stars-shield]: https://img.shields.io/github/stars/othneildrew/Best-README-Template.svg?style=flat-square
[stars-url]: https://github.com/othneildrew/Best-README-Template/stargazers
[issues-shield]: https://img.shields.io/github/issues/othneildrew/Best-README-Template.svg?style=flat-square
[issues-url]: https://github.com/othneildrew/Best-README-Template/issues
[license-shield]: https://img.shields.io/github/license/othneildrew/Best-README-Template.svg?style=flat-square
[license-url]: https://github.com/othneildrew/Best-README-Template/blob/master/LICENSE.txt
[linkedin-shield]: https://img.shields.io/badge/-LinkedIn-black.svg?style=flat-square&logo=linkedin&colorB=555
[linkedin-url]: https://linkedin.com/in/othneildrew
[product-screenshot]: images/screenshot.png



###  History


### Codebase


### Status


### Getting Started


### Technical


<!-- LICENSE -->
## License

Distributed under the MIT License. See `LICENSE` for more information.

