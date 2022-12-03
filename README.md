# network

## Install
```
npm install @winkgroup/network
```

public baseurl template accepts these placeholders:
- {{IP}}
- {{PORT}}

if publicBaseurlTemplate is not set, the host is considered not public (dynamic IP address e.g. DHCP, ecc...) 

## Contributing
NOTICE: `@types/express` is required to be in dependencies, not just a devDependencies beacause type `Router` is required in js built script
