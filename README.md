# Squeaky Script

The script that is loaded by clients to stream events in to Squeaky Gateway.

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
    s._sqSettings={site_id:'f39d5fc1-097b-4a30-8334-d628623390d4'};
    u=q.getElementsByTagName('head')[0];
    k=q.createElement('script');k.async=1;
    k.src=e+s._sqSettings.site_id;
    u.appendChild(k);
  })(window,document,'https://cdn.squeaky.ai/g/0.1.0/script.js?');
</script>
```