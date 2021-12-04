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

### Running the tests
```shell
$ yarn test
```

### Example import
```html
<!-- Squeaky Tracking Code for https://hackerstash.com -->
<script>
  (function(s,q,e,a,u,k,y){
    s._sqSettings={site_id:'eba391ce-cc12-41d7-8f8a-ddee1e624a74'};
    u=q.getElementsByTagName('head')[0];
    k=q.createElement('script');
    k.src=e+s._sqSettings.site_id;
    u.appendChild(k);
  })(window,document,'https://cdn.squeaky.ai/g/0.4.0/script.js?');
</script>
```