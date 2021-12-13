# Squeaky Script

The public scripts that are used to get data into Squeaky. These are:

- `./src/nps` is loaded into the NPS iframe that's served by the gateway
- `./src/script` is loaded in the users browser to trigger recordings, load nps/sentiment iframes etc
- `./src/sentiment` is loaded into the sentiment iframe that's served by the gateway

They each inject their own styles and should be self contained. The main script is not within an iframe, and will need to be defensive against the host websites styles.

### Requirements
- Node.js v14.x
- Yarn
- AWS Credentials at ~/.aws

### Installation
```shell
$ git clone git@github.com:squeaky-ai/script.git
$ cd script
$ yarn install
```

### Running locally
Firstly you will need the gateway running at `ws://localhost:5000`, you'll also need to create a site locally with the uuid of `eba391ce-cc12-41d7-8f8a-ddee1e624a74`.

Run `yarn watch` to watch and build the script, and run `yarn serve` to start the dev server.

There are example websites in the `examples/` folder, they can be accessed by visiting their path for example:
- http://localhost:8080/examples/album/
- http://localhost:8080/examples/auth/
- http://localhost:8080/examples/blog/
- http://localhost:8080/examples/carousel/
