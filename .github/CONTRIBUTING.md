# How to Contribute to `vite-plugin-single-spa`

Hello, and thank you for your interest in driving this project even higher.  This project is the result of serious 
investigation, troubleshooting and essay on the part of its creator.

## Developer Vision

> The plug-in's API must be easy to use and difficult to abuse.

Have this in mind when planning on contributing.

## Contributing Bug Fixes

If you encounter a problem and would like to volunteer a fix, kindly follow these steps:

1. Create an issue [here](https://github.com/WJSoftware/vite-plugin-single-spa/issues) to document the problem.
2. Reproduce the problem with one or more unit tests.  Currently, there are unit tests for the plug-in's main code, 
not for the CSS mounting algorithm.[^1]  Make sure the test description starts with `ISS<issue number>: `, where 
`<issue number>` is the issue number of the issue opened in step 1.
3. Correct the problem as you see fit.
4. Make sure all unit tests pass, including those added in step 2.
5. Create a pull request that contains the new unit tests and the fix or fixes, and mention the issue being fixed in 
the pull request's description.

[^1]: Test files are located in the `/tests` folder.

## Contributing New Features

This one is a bit more elaborate, and in order to avoid wasting your time, please always start by opening an issue.

1. Create an issue [here](https://github.com/WJSoftware/vite-plugin-single-spa/issues) to document what the new 
feautre is about.  Include:
        1. A justification for the new feature:  Why is this feature useful?  What's your motivation to request it?
        2. The implications for you, the consumer of the plug-in, if the feature is not implemented:  What workarounds 
        must you do?  What functionality cannot be exploited? Etc.
2. Wait for the feature request to be discussed and approved.
3. If the feature request is approved, create a draft pull request and start working on the feature.  Make sure you 
mention the issue created in step 1 in the pull request's description.
4. The pull request must provide:
        1. The new feature, of course.
        2. Unit tests that cover the new feature's functionality.
        3. Documentation changes that explain the new feature and how to use it.
        4. TypeScirpt types for the new feature.
        5. JsDoc comments on everything that is exposed to the plug-in consumers, for the benefit of Intellisense.
5. Continue to add commits to the pull request as you see fit, and once it has completed the requirements, request 
review of the pull request from user `webJose`.

As you write code, always have the developer vision in mind.  This is done by properly typing things, documenting 
things, providing sensible default values of properties and options, etc.

### Documenting Features

As you can see, the README file marks all features by setting the minimum plug-in version that implements it.  Make 
sure you do that.  If you're unsure about which version number the feature will be available, ask `webJose`.

## Other Guidelines

1. The title of pull requests must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
