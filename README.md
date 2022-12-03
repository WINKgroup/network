# network

## Install
```
npm install @winkgroup/network
```

create a `.env` file with these optional params:
```
IP=
PORT=
PUBLIC_BASEURL_TEMPLATE=
```
public baseurl template accepts these placeholders:
- {{IP}}
- {{PORT}}

if PUBLIC_BASEURL_TEMPLATE is not set, the host is considered not public (dynamic IP address e.g. DHCP, ecc...) 

## Contributing
NOTICE: `@types/express` is required to be in dependencies, not just a devDependencies beacause type `Router` is required in js built script
